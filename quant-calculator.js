/**
 * 量化参数计算引擎
 * 基于模型参数、量化位宽和硬件配置计算各项指标
 */

// ===== 量化计算常量 =====
const QuantConstants = {
    // 基础精度参数 (FP32)
    FP32_BYTES: 4,
    FP16_BYTES: 2,
    INT8_BYTES: 1,

    // 硬件基准 (以RTX 4090为基准)
    BASELINE_GPU: 'RTX 4090',
    BASELINE_SPEED: 100, // tok/s 基准速度
    BASELINE_VRAM: 24,   // GB
    BASELINE_POWER: 185, // W

    // 各代显卡性能系数
    GPU_COEFFICIENTS: {
        'RTX 4090': { speed: 1.0, power: 1.0 },
        'RTX 4080': { speed: 0.76, power: 1.73 },
        'RTX 3090 Ti': { speed: 0.71, power: 2.43 },
        'RTX 3080': { speed: 0.51, power: 1.73 },
        'A100 80GB': { speed: 1.31, power: 1.62 },
        'L40S': { speed: 1.15, power: 1.89 }
    },

    // 量化方法效率系数
    QUANT_METHODS: {
        'AWQ': { speedFactor: 1.0, accuracyPenalty: 0.02 },
        'GPTQ': { speedFactor: 0.95, accuracyPenalty: 0.03 },
        'GGUF': { speedFactor: 1.05, accuracyPenalty: 0.02 },
        'INT8': { speedFactor: 1.1, accuracyPenalty: 0.01 },
        'FP8': { speedFactor: 1.15, accuracyPenalty: 0.01 }
    },

    // 模型类型复杂度系数 (相对base模型)
    MODEL_COMPLEXITY: {
        'chat': 1.0,
        'text-generation': 1.0,
        'code': 1.1,
        'embedding': 0.8
    },

    // 精度-位宽对应表 (基于大量实验数据的拟合曲线)
    ACCURACY_CURVE: {
        2: 0.42,
        3: 0.65,
        4: 0.88,
        5: 0.92,
        6: 0.94,
        7: 0.96,
        8: 0.97,
        9: 0.98,
        10: 0.99,
        11: 0.995,
        12: 0.998,
        13: 0.999,
        14: 0.9995,
        15: 0.9998,
        16: 1.0
    },

    // 位宽-速度提升曲线 (相对于FP16)
    SPEED_CURVE: {
        2: 2.3,
        3: 2.0,
        4: 1.8,
        5: 1.6,
        6: 1.5,
        7: 1.35,
        8: 1.2,
        9: 1.15,
        10: 1.08,
        11: 1.05,
        12: 1.03,
        13: 1.02,
        14: 1.01,
        15: 1.005,
        16: 1.0
    }
};

// ===== 显卡规格数据库 =====
const GPUDatabase = {
    'RTX 4090': {
        vram: 24,
        cuda: 16384,
        tensor: 512,
        memoryBandwidth: 1008,  // GB/s
        computePower: 82.6      // TFLOPS
    },
    'RTX 4080': {
        vram: 16,
        cuda: 9728,
        tensor: 304,
        memoryBandwidth: 716,   // GB/s
        computePower: 48.7
    },
    'RTX 3090 Ti': {
        vram: 24,
        cuda: 10752,
        tensor: 336,
        memoryBandwidth: 1008,
        computePower: 40.0
    },
    'RTX 3080': {
        vram: 10,
        cuda: 8704,
        tensor: 272,
        memoryBandwidth: 760,
        computePower: 29.7
    },
    'A100 80GB': {
        vram: 80,
        cuda: 6912,
        tensor: 432,
        memoryBandwidth: 2039,
        computePower: 77.97
    },
    'L40S': {
        vram: 48,
        cuda: 18176,
        tensor: 568,
        memoryBandwidth: 864,
        computePower: 91.1
    }
};

// ===== 量化计算引擎 =====
const QuantCalculator = {
    /**
     * 计算模型原始大小
     * @param {string} params - 参数规模，如 "7B", "13B"
     * @returns {number} 原始大小 (GB)
     */
    getOriginalSize(params) {
        const match = params.match(/(\d+)B?/);
        if (!match) return 0;
        const billions = parseInt(match[1]);
        // FP32: 参数 * 4 bytes / 1024^3
        return (billions * 1e9 * QuantConstants.FP32_BYTES) / (1024 ** 3);
    },

    /**
     * 计算量化后模型大小
     * @param {string} params - 参数规模
     * @param {number} bitWidth - 量化位宽
     * @param {Object} options - 选项
     * @returns {Object} 大小信息
     */
    calculateSize(params, bitWidth, options = {}) {
        const {
            quantMethod = 'GPTQ',
            includeKVCache = true,
            useMixedPrecision = true
        } = options;

        const originalSize = this.getOriginalSize(params);
        const modelSize = originalSize * (bitWidth / 16);

        // KV Cache 估算 (通常是模型的5-10%)
        const kvCacheSize = includeKVCache ? originalSize * 0.08 * (bitWidth / 16) : 0;

        // 量化开销 (通常1-3%)
        const quantOverhead = originalSize * 0.02;

        const totalSize = modelSize + kvCacheSize + quantOverhead;
        const compressionRatio = originalSize / totalSize;

        return {
            originalSize: originalSize.toFixed(2),
            modelSize: modelSize.toFixed(2),
            kvCacheSize: kvCacheSize.toFixed(2),
            overhead: quantOverhead.toFixed(2),
            totalSize: totalSize.toFixed(2),
            compressionRatio: compressionRatio.toFixed(2),
            savingsPercent: ((1 - totalSize / originalSize) * 100).toFixed(1)
        };
    },

    /**
     * 计算推理速度
     * @param {number} bitWidth - 量化位宽
     * @param {Object} options - 选项
     * @returns {Object} 速度信息
     */
    calculateSpeed(bitWidth, options = {}) {
        const {
            gpu = 'RTX 4090',
            quantMethod = 'GPTQ',
            modelType = 'chat',
            params = '7B'
        } = options;

        const baseSpeed = QuantConstants.BASELINE_SPEED;
        const gpuCoeff = QuantConstants.GPU_COEFFICIENTS[gpu] || QuantConstants.GPU_COEFFICIENTS['RTX 4090'];
        const methodCoeff = QuantConstants.QUANT_METHODS[quantMethod] || QuantConstants.QUANT_METHODS['GPTQ'];

        // 速度提升曲线
        const speedCurve = QuantConstants.SPEED_CURVE[bitWidth] || 1.0;

        // 模型规模系数 (大模型推理相对慢一些)
        const paramsNum = parseInt(params.replace('B', ''));
        const sizeFactor = 1 + Math.log10(paramsNum) * 0.1;

        // 模型类型系数
        const typeFactor = QuantConstants.MODEL_COMPLEXITY[modelType] || 1.0;

        // 综合计算
        let speed = baseSpeed * speedCurve * gpuCoeff.speed * methodCoeff.speedFactor;
        speed = speed / (sizeFactor * typeFactor);

        return {
            speed: speed.toFixed(1),
            unit: 'tok/s',
            baseSpeed: baseSpeed.toFixed(1),
            speedup: speedCurve.toFixed(2) + 'x',
            gpuFactor: gpuCoeff.speed.toFixed(2)
        };
    },

    /**
     * 计算显存消耗
     * @param {string} params - 参数规模
     * @param {number} bitWidth - 量化位宽
     * @param {Object} options - 选项
     * @returns {Object} 显存信息
     */
    calculateMemory(params, bitWidth, options = {}) {
        const {
            gpu = 'RTX 4090',
            contextLength = 2048,
            batchSize = 1
        } = options;

        const gpuSpec = GPUDatabase[gpu] || GPUDatabase['RTX 4090'];

        // 模型权重显存
        const weightsMemory = this.getOriginalSize(params) * (bitWidth / 16);

        // KV Cache 显存
        // 公式: 2 * 层数 * 隐藏层大小 * 上下文长度 * 位宽 / 8
        const layers = Math.ceil(parseInt(params.replace('B', '')) * 1.5);
        const hiddenSize = parseInt(params.replace('B', '')) * 128;
        const kvPerLayer = 2 * hiddenSize * contextLength * (bitWidth / 8);
        const totalKV = layers * kvPerLayer / (1024 ** 3);

        // 激活值显存 (约为权重的10-20%)
        const activationMemory = weightsMemory * 0.15;

        // 临时计算buffer
        const workspaceMemory = weightsMemory * 0.05;

        const totalUsed = weightsMemory + totalKV + activationMemory + workspaceMemory;
        const totalVram = gpuSpec.vram;
        const usagePercent = (totalUsed / totalVram * 100).toFixed(1);

        // 是否能运行
        const canRun = totalUsed <= totalVram * 0.9;

        return {
            weights: weightsMemory.toFixed(2),
            kvCache: totalKV.toFixed(2),
            activation: activationMemory.toFixed(2),
            workspace: workspaceMemory.toFixed(2),
            totalUsed: totalUsed.toFixed(2),
            totalVram: totalVram,
            usagePercent: usagePercent,
            canRun: canRun,
            status: canRun ? 'ok' : (totalUsed <= totalVram ? 'warning' : 'error'),
            recommended: totalUsed <= totalVram * 0.7 ? 'optimal' :
                         totalUsed <= totalVram * 0.85 ? 'good' : 'tight'
        };
    },

    /**
     * 计算精度损失
     * @param {number} bitWidth - 量化位宽
     * @param {Object} options - 选项
     * @returns {Object} 精度信息
     */
    calculateAccuracy(bitWidth, options = {}) {
        const {
            quantMethod = 'GPTQ',
            params = '7B',
            modelType = 'chat'
        } = options;

        const methodCoeff = QuantConstants.QUANT_METHODS[quantMethod] || QuantConstants.QUANT_METHODS['GPTQ'];
        const baseAccuracy = QuantConstants.ACCURACY_CURVE[bitWidth] || 1.0;

        // 应用量化方法带来的额外损失
        const totalAccuracy = baseAccuracy * (1 - methodCoeff.accuracyPenalty);

        // 模型规模影响 (大模型对量化更鲁棒)
        const paramsNum = parseInt(params.replace('B', ''));
        const sizeBonus = Math.min(0.02, paramsNum * 0.002);

        const finalAccuracy = Math.min(1, totalAccuracy + sizeBonus);

        // 困惑度估算 (基于精度)
        // PPL 与精度的非线性关系
        const basePPL = 10;
        const ppl = basePPL * Math.pow((1 - finalAccuracy + 0.01), 0.5);

        // 精度损失
        const accuracyLoss = ((1 - finalAccuracy) * 100).toFixed(2);

        return {
            accuracy: (finalAccuracy * 100).toFixed(1),
            accuracyPercent: finalAccuracy,
            ppl: ppl.toFixed(2),
            accuracyLoss: accuracyLoss,
            status: finalAccuracy > 0.95 ? 'excellent' :
                   finalAccuracy > 0.90 ? 'good' :
                   finalAccuracy > 0.80 ? 'acceptable' : 'poor'
        };
    },

    /**
     * 计算能效比
     * @param {number} bitWidth - 量化位宽
     * @param {Object} options - 选项
     * @returns {Object} 能效信息
     */
    calculateEfficiency(bitWidth, options = {}) {
        const {
            gpu = 'RTX 4090',
            quantMethod = 'GPTQ'
        } = options;

        const gpuCoeff = QuantConstants.GPU_COEFFICIENTS[gpu] || QuantConstants.GPU_COEFFICIENTS['RTX 4090'];
        const methodCoeff = QuantConstants.QUANT_METHODS[quantMethod] || QuantConstants.QUANT_METHODS['GPTQ'];

        // 基础能效
        const basePower = QuantConstants.BASELINE_POWER;
        const speedCurve = QuantConstants.SPEED_CURVE[bitWidth] || 1.0;

        // 功耗变化 (量化降低功耗，但有下限)
        const powerReduction = Math.min(0.3, (16 - bitWidth) * 0.02);
        const power = basePower * gpuCoeff.power * (1 - powerReduction);

        // 速度提升
        const speed = QuantConstants.BASELINE_SPEED * speedCurve * gpuCoeff.speed * methodCoeff.speedFactor;

        // 能效比 (tok/s per Watt)
        const efficiency = speed / power;

        // 相对于FP16的能效提升
        const efficiencyGain = (efficiency / (QuantConstants.BASELINE_SPEED / basePower)).toFixed(2);

        return {
            power: power.toFixed(0),
            speed: speed.toFixed(1),
            efficiency: efficiency.toFixed(2),
            unit: 'tok/s/W',
            gain: efficiencyGain + 'x',
            status: efficiency > 0.5 ? 'excellent' :
                   efficiency > 0.35 ? 'good' : 'normal'
        };
    },

    /**
     * 计算延迟
     * @param {number} bitWidth - 量化位宽
     * @param {Object} options - 选项
     * @returns {Object} 延迟信息
     */
    calculateLatency(bitWidth, options = {}) {
        const {
            gpu = 'RTX 4090',
            quantMethod = 'GPTQ',
            params = '7B'
        } = options;

        const gpuSpec = GPUDatabase[gpu] || GPUDatabase['RTX 4090'];
        const methodCoeff = QuantConstants.QUANT_METHODS[quantMethod] || QuantConstants.QUANT_METHODS['GPTQ'];

        // TTFT (Time To First Token) 主要受权重大小和带宽影响
        const modelSize = this.getOriginalSize(params) * (bitWidth / 16);
        const bandwidth = gpuSpec.memoryBandwidth;
        const loadTime = (modelSize * 1024) / bandwidth; // seconds

        // 首次Token处理时间
        const firstTokenTime = loadTime * 0.3 * (1 / methodCoeff.speedFactor);

        // 单Token生成时间
        const perTokenTime = firstTokenTime * 0.1;

        // 总延迟 (首Token + 生成时间)
        const totalLatency = firstTokenTime + perTokenTime * 100; // 假设生成100个token

        // TTFT 指标
        const ttft = firstTokenTime;

        return {
            ttft: ttft.toFixed(2),
            unit: 's',
            firstToken: firstTokenTime.toFixed(3),
            perToken: perTokenTime.toFixed(4),
            totalFor100: totalLatency.toFixed(1),
            status: ttft < 1 ? 'realtime' :
                   ttft < 3 ? 'interactive' : 'batch'
        };
    },

    /**
     * 综合计算所有指标
     * @param {Object} model - 模型信息
     * @param {number} bitWidth - 量化位宽
     * @param {Object} config - 配置
     * @returns {Object} 完整计算结果
     */
    calculateAll(model, bitWidth, config = {}) {
        const {
            gpu = 'RTX 4090',
            quantMethod = 'GPTQ',
            contextLength = 2048
        } = config;

        const size = this.calculateSize(model.params, bitWidth, { quantMethod });
        const speed = this.calculateSpeed(bitWidth, { gpu, quantMethod, modelType: model.type, params: model.params });
        const memory = this.calculateMemory(model.params, bitWidth, { gpu, contextLength });
        const accuracy = this.calculateAccuracy(bitWidth, { quantMethod, params: model.params, modelType: model.type });
        const efficiency = this.calculateEfficiency(bitWidth, { gpu, quantMethod });
        const latency = this.calculateLatency(bitWidth, { gpu, quantMethod, params: model.params });

        // 计算综合评分 (0-100)
        const score = (
            (accuracy.accuracyPercent * 0.3 +
            Math.min(speed.speed / 100, 1) * 0.25 +
            (1 - memory.usagePercent / 100) * 0.2 +
            parseFloat(efficiency.gain) * 0.15 +
            (latency.ttft < 2 ? 1 : latency.ttft < 5 ? 0.7 : 0.4) * 0.1) * 100
        ).toFixed(0);

        return {
            model: model.name,
            bitWidth,
            gpu,
            quantMethod,
            size,
            speed,
            memory,
            accuracy,
            efficiency,
            latency,
            score,
            summary: {
                compression: `${size.savingsPercent}%`,
                speedup: speed.speedup,
                efficiency: efficiency.gain + 'x',
                accuracy: `${accuracy.accuracy}%`,
                vram: `${memory.totalUsed}GB / ${memory.totalVram}GB`
            }
        };
    },

    /**
     * 生成不同位宽的对比数据
     * @param {Object} model - 模型信息
     * @param {Object} config - 配置
     * @returns {Array} 所有位宽的计算结果
     */
    generateComparison(model, config = {}) {
        const { gpu = 'RTX 4090', quantMethod = 'GPTQ' } = config;

        const results = [];
        for (let bits = 2; bits <= 16; bits++) {
            results.push(this.calculateAll(model, bits, { gpu, quantMethod }));
        }
        return results;
    },

    /**
     * 生成不同显卡的对比数据
     * @param {Object} model - 模型信息
     * @param {number} bitWidth - 量化位宽
     * @param {Object} config - 配置
     * @returns {Array} 所有显卡的计算结果
     */
    compareGPUs(model, bitWidth, config = {}) {
        const { quantMethod = 'GPTQ' } = config;

        const results = [];
        const gpus = Object.keys(GPUDatabase);

        for (const gpu of gpus) {
            results.push(this.calculateAll(model, bitWidth, { gpu, quantMethod }));
        }

        // 按速度排序
        results.sort((a, b) => parseFloat(b.speed.speed) - parseFloat(a.speed.speed));

        return results;
    }
};

// ===== 导出 =====
window.QuantCalculator = QuantCalculator;
window.QuantConstants = QuantConstants;
window.GPUDatabase = GPUDatabase;
