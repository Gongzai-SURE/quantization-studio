// ===== Sample Model Data =====
const models = [
    { id: 1, name: 'Llama-2-7B-Chat', org: 'meta-llama', params: '7B', type: 'chat', tags: ['transformer', 'causal-lm'] },
    { id: 2, name: 'Llama-2-13B-Chat', org: 'meta-llama', params: '13B', type: 'chat', tags: ['transformer', 'causal-lm'] },
    { id: 3, name: 'Llama-2-70B-Chat', org: 'meta-llama', params: '70B', type: 'chat', tags: ['transformer', 'causal-lm'] },
    { id: 4, name: 'Qwen-7B-Chat', org: 'Qwen', params: '7B', type: 'chat', tags: ['transformer', 'causal-lm'] },
    { id: 5, name: 'Qwen-14B-Chat', org: 'Qwen', params: '14B', type: 'chat', tags: ['transformer', 'causal-lm'] },
    { id: 6, name: 'Mistral-7B-Instruct', org: 'mistralai', params: '7B', type: 'chat', tags: ['transformer', 'causal-lm'] },
    { id: 7, name: 'Mistral-7B-v0.1', org: 'mistralai', params: '7B', type: 'text-generation', tags: ['transformer', 'causal-lm'] },
    { id: 8, name: 'ChatGLM3-6B', org: 'THUDM', params: '6B', type: 'chat', tags: ['transformer', 'causal-lm'] },
    { id: 9, name: 'Yi-6B-Chat', org: '01-ai', params: '6B', type: 'chat', tags: ['transformer', 'causal-lm'] },
    { id: 10, name: 'Baichuan2-7B-Chat', org: 'baichuan-inc', params: '7B', type: 'chat', tags: ['transformer', 'causal-lm'] },
    { id: 11, name: 'CodeLlama-7B-Instruct', org: 'meta-llama', params: '7B', type: 'code', tags: ['transformer', 'causal-lm'] },
    { id: 12, name: 'DeepSeek-7B-Chat', org: 'deepseek-ai', params: '7B', type: 'chat', tags: ['transformer', 'causal-lm'] },
];

// ===== State =====
let selectedModel = null;
let currentTemplate = 'chat';
let isRunning = false;

// ===== DOM Elements =====
const modelGrid = document.getElementById('modelGrid');
const modelSearchInput = document.getElementById('modelSearch');
const bitSlider = document.getElementById('bitSlider');
const bitValue = document.getElementById('bitValue');
const bitDesc = document.getElementById('bitDesc');
const presetBtns = document.querySelectorAll('.preset-btn');
const toggleAdvanced = document.getElementById('toggleAdvanced');
const advancedOptions = document.getElementById('advancedOptions');
const templateTabs = document.querySelectorAll('.template-tab');
const promptInput = document.getElementById('promptInput');
const charCount = document.querySelector('.char-count');
const runBtn = document.getElementById('runBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const progressFill = document.getElementById('progressFill');
const progressText = document.querySelector('.progress-text');
const resultsSection = document.getElementById('resultsSection');

// ===== Prompt Templates =====
const templates = {
    chat: `请解释一下什么是机器学习，以及它的主要应用场景。`,
    completion: `机器学习是人工智能的一个核心分支，它使计算机系统能够`,
    custom: ''
};

// ===== Bit Width Descriptions =====
const bitDescriptions = {
    2: '极致压缩，适合边缘设备',
    3: '超低精度，可能影响质量',
    4: '推荐用于大多数场景',
    5: '平衡精度与大小',
    6: '较高精度，适中大小',
    7: '接近FP16精度',
    8: '接近INT8，精度损失小',
    9: '高质量量化',
    10: '高质量量化',
    11: '高质量量化',
    12: '高质量量化',
    13: '接近原始精度',
    14: '接近原始精度',
    15: '接近原始精度',
    16: '原始精度（无量化）'
};

// ===== GPU Data =====
const gpuData = {
    rtx40: [
        { name: 'RTX 4090', spec: '24GB GDDR6X · 16384 CUDA', speed: 68.5, vram: 6.2, totalVram: 24, power: 185, rank: 1 },
        { name: 'RTX 4080', spec: '16GB GDDR6X · 9728 CUDA', speed: 52.3, vram: 6.2, totalVram: 16, power: 320, rank: 2 }
    ],
    rtx30: [
        { name: 'RTX 3090 Ti', spec: '24GB GDDR6X · 10752 CUDA', speed: 48.7, vram: 6.2, totalVram: 24, power: 450, rank: 3 },
        { name: 'RTX 3080', spec: '10GB GDDR6X · 8704 CUDA', speed: 35.2, vram: 6.2, totalVram: 10, power: 320, rank: 4 }
    ],
    a100: [
        { name: 'A100 80GB', spec: '80GB HBM2e · 6912 CUDA', speed: 89.4, vram: 6.2, totalVram: 80, power: 300, rank: 5, premium: true },
        { name: 'L40S', spec: '48GB GDDR6X · 18176 CUDA', speed: 78.6, vram: 6.2, totalVram: 48, power: 350, rank: 6, premium: true }
    ]
};

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    initModelGrid();
    initSearch();
    initBitSlider();
    initPresets();
    initAdvancedToggle();
    initTemplateTabs();
    initPromptInput();
    initRunButton();
    initGPUTabs();
    initUserAuth();
    initChartTabs();
    initChartControls();
    initDocsModal();
    renderAllCharts();
    initPageNavigation();
    initSensitivityHeatmap();
});

// ===== Chart Colors =====
const MODEL_COLORS = [
    '#FF6B35', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

function getModelColor(modelName) {
    let hash = 0;
    for (let i = 0; i < modelName.length; i++) {
        hash = modelName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return MODEL_COLORS[Math.abs(hash) % MODEL_COLORS.length];
}

// ===== Chart Tabs =====
function initChartTabs() {
    const tabs = document.querySelectorAll('.chart-tab');
    const views = document.querySelectorAll('.chart-view');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const chartType = tab.dataset.chart;

            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            views.forEach(view => {
                view.classList.toggle('active', view.id === `${chartType}-chart`);
            });

            // Render the selected chart
            renderSelectedChart(chartType);
        });
    });
}

function initChartControls() {
    const refreshBtn = document.getElementById('refreshChart');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            renderAllCharts();
        });
    }

    const modelSelect = document.getElementById('chartModelSelect');
    const compareSelect = document.getElementById('compareModelSelect');

    if (modelSelect) {
        // Populate with models from history
        updateModelSelectOptions(modelSelect, compareSelect);

        modelSelect.addEventListener('change', () => {
            renderAllCharts();
        });
    }

    if (compareSelect) {
        compareSelect.addEventListener('change', () => {
            renderAllCharts();
        });
    }
}

function updateModelSelectOptions(modelSelect, compareSelect) {
    const history = DataManager.getHistory();
    const modelNames = [...new Set(history.map(h => h.modelName))];

    modelSelect.innerHTML = '<option value="current">使用当前选择</option>';
    modelNames.forEach(name => {
        modelSelect.innerHTML += `<option value="${name}">${name}</option>`;
    });

    if (compareSelect) {
        compareSelect.innerHTML = '<option value="">无</option>';
        modelNames.forEach(name => {
            compareSelect.innerHTML += `<option value="${name}">${name}</option>`;
        });
    }
}

function renderAllCharts() {
    renderAccuracySpeedChart();
    renderBitwidthVramChart();
    renderBitwidthPplChart();
    renderBitwidthThroughputChart();
    renderSeqlenLatencyChart();
    renderHistoryComparisonChart();
}

function renderSelectedChart(chartType) {
    switch(chartType) {
        case 'accuracy-speed':
            renderAccuracySpeedChart();
            break;
        case 'bitwidth-vram':
            renderBitwidthVramChart();
            break;
        case 'bitwidth-ppl':
            renderBitwidthPplChart();
            break;
        case 'bitwidth-throughput':
            renderBitwidthThroughputChart();
            break;
        case 'seqlen-latency':
            renderSeqlenLatencyChart();
            break;
        case 'history-comparison':
            renderHistoryComparisonChart();
            break;
    }
}

// ===== Accuracy vs Speed Scatter Chart =====
function renderAccuracySpeedChart() {
    const container = document.getElementById('accuracySpeedChart');
    if (!container) return;

    const currentModel = selectedModel || { name: 'Llama-2-7B', params: '7B', type: 'chat' };
    const history = DataManager.getHistory();

    // Generate data for all bit widths
    const data = [];
    for (let bits = 2; bits <= 16; bits++) {
        const result = QuantCalculator.calculateAll(currentModel, bits, {
            gpu: 'RTX 4090',
            quantMethod: 'GPTQ'
        });
        data.push({
            bitWidth: bits,
            accuracy: parseFloat(result.accuracy.accuracy),
            speed: parseFloat(result.speed.speed),
            ppl: parseFloat(result.accuracy.ppl),
            color: getModelColor(currentModel.name)
        });
    }

    // Add history points
    history.forEach(h => {
        if (h.metrics) {
            data.push({
                bitWidth: h.bitWidth,
                accuracy: parseFloat(h.metrics.accuracy?.replace('%', '')) || 95,
                speed: parseFloat(h.metrics.speed?.replace(' tok/s', '')) || 50,
                ppl: 0,
                fromHistory: true,
                modelName: h.modelName,
                timestamp: h.timestamp,
                color: getModelColor(h.modelName)
            });
        }
    });

    // SVG dimensions
    const width = container.offsetWidth || 600;
    const height = container.offsetHeight || 300;
    const padding = { top: 30, right: 30, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Scales
    const xMax = 100;
    const yMax = Math.max(...data.map(d => d.speed)) * 1.1;

    const xScale = (x) => padding.left + (x / xMax) * chartWidth;
    const yScale = (y) => padding.top + chartHeight - (y / yMax) * chartHeight;

    // Build SVG
    let svg = `<svg class="chart-svg" viewBox="0 0 ${width} ${height}">`;

    // Grid
    for (let i = 0; i <= 5; i++) {
        const x = padding.left + (i / 5) * chartWidth;
        const y = padding.top + (i / 5) * chartHeight;
        svg += `<line class="chart-grid" x1="${x}" y1="${padding.top}" x2="${x}" y2="${height - padding.bottom}"/>`;
        svg += `<line class="chart-grid" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"/>`;
    }

    // Axes
    svg += `<line class="chart-axis" x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}"/>`;
    svg += `<line class="chart-axis" x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}"/>`;

    // Axis labels
    svg += `<text class="chart-axis-label" x="${width / 2}" y="${height - 5}" text-anchor="middle">精度 (%)</text>`;
    svg += `<text class="chart-axis-label" x="10" y="${height / 2}" text-anchor="middle" transform="rotate(-90, 10, ${height / 2})">速度 (tok/s)</text>`;

    // Y-axis values
    for (let i = 0; i <= 5; i++) {
        const val = Math.round((i / 5) * yMax);
        const y = padding.top + (i / 5) * chartHeight;
        svg += `<text class="chart-axis-label" x="${padding.left - 8}" y="${y + 4}" text-anchor="end">${val}</text>`;
    }

    // X-axis values
    for (let i = 0; i <= 5; i++) {
        const val = Math.round((i / 5) * xMax);
        const x = padding.left + (i / 5) * chartWidth;
        svg += `<text class="chart-axis-label" x="${x}" y="${height - padding.bottom + 15}" text-anchor="middle">${val}</text>`;
    }

    // Draw points
    data.forEach((d, i) => {
        const x = xScale(d.accuracy);
        const y = yScale(d.speed);
        const r = d.fromHistory ? 5 : 6;
        const opacity = d.fromHistory ? 0.6 : 1;

        svg += `<circle class="chart-point" cx="${x}" cy="${y}" r="${r}" fill="${d.color}" opacity="${opacity}"/>`;
        svg += `<circle cx="${x}" cy="${y}" r="${r + 3}" fill="none" stroke="${d.color}" stroke-width="1" opacity="0.3" class="hover-ring"/>`;
    });

    // Draw current selection highlight
    const currentBits = parseInt(bitSlider?.value || 4);
    const currentData = data.find(d => d.bitWidth === currentBits && !d.fromHistory);
    if (currentData) {
        const x = xScale(currentData.accuracy);
        const y = yScale(currentData.speed);
        svg += `<circle cx="${x}" cy="${y}" r="10" fill="none" stroke="${currentData.color}" stroke-width="2" stroke-dasharray="4,2"/>`;
        svg += `<text class="chart-point-label" x="${x}" y="${y - 15}" text-anchor="middle">${currentBits}-bit</text>`;
    }

    svg += '</svg>';
    container.innerHTML = svg;

    // Legend
    renderLegend('asChartLegend', [{ color: getModelColor(currentModel.name), label: currentModel.name }]);
}

// ===== Bitwidth vs VRAM Line Chart =====
function renderBitwidthVramChart() {
    const container = document.getElementById('bitwidthVramChart');
    if (!container) return;

    const currentModel = selectedModel || { name: 'Llama-2-7B', params: '7B', type: 'chat' };
    const compareName = document.getElementById('compareModelSelect')?.value;

    const datasets = [{
        name: currentModel.name,
        color: getModelColor(currentModel.name),
        data: []
    }];

    // Generate data for current model
    for (let bits = 2; bits <= 16; bits++) {
        const result = QuantCalculator.calculateAll(currentModel, bits, { gpu: 'RTX 4090' });
        datasets[0].data.push({
            bitWidth: bits,
            vram: parseFloat(result.memory.totalUsed)
        });
    }

    // Add comparison model
    if (compareName) {
        const compareModel = models.find(m => m.name === compareName) || { name: compareName, params: '7B', type: 'chat' };
        datasets.push({
            name: compareName,
            color: getModelColor(compareName),
            data: []
        });
        for (let bits = 2; bits <= 16; bits++) {
            const result = QuantCalculator.calculateAll(compareModel, bits, { gpu: 'RTX 4090' });
            datasets[1].data.push({
                bitWidth: bits,
                vram: parseFloat(result.memory.totalUsed)
            });
        }
    }

    // SVG dimensions
    const width = container.offsetWidth || 600;
    const height = container.offsetHeight || 300;
    const padding = { top: 30, right: 30, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const xMax = 16;
    const yMax = Math.max(...datasets.map(d => Math.max(...d.data.map(p => p.vram)))) * 1.2;

    const xScale = (x) => padding.left + ((x - 2) / (xMax - 2)) * chartWidth;
    const yScale = (y) => padding.top + chartHeight - (y / yMax) * chartHeight;

    let svg = `<svg class="chart-svg" viewBox="0 0 ${width} ${height}">`;

    // Grid
    for (let i = 0; i <= 5; i++) {
        const x = padding.left + (i / 5) * chartWidth;
        const y = padding.top + (i / 5) * chartHeight;
        svg += `<line class="chart-grid" x1="${x}" y1="${padding.top}" x2="${x}" y2="${height - padding.bottom}"/>`;
        svg += `<line class="chart-grid" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"/>`;
    }

    // Axes
    svg += `<line class="chart-axis" x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}"/>`;
    svg += `<line class="chart-axis" x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}"/>`;

    // Axis labels
    svg += `<text class="chart-axis-label" x="${width / 2}" y="${height - 5}" text-anchor="middle">量化位宽 (bit)</text>`;
    svg += `<text class="chart-axis-label" x="10" y="${height / 2}" text-anchor="middle" transform="rotate(-90, 10, ${height / 2})">显存占用 (GB)</text>`;

    // Draw lines and points for each dataset
    datasets.forEach(dataset => {
        const points = dataset.data.map(d => `${xScale(d.bitWidth)},${yScale(d.vram)}`).join(' ');
        svg += `<polyline class="chart-line" points="${points}" stroke="${dataset.color}"/>`;

        dataset.data.forEach(d => {
            const x = xScale(d.bitWidth);
            const y = yScale(d.vram);
            svg += `<circle class="chart-point" cx="${x}" cy="${y}" r="4" fill="${dataset.color}"/>`;
        });
    });

    // X-axis values
    for (let bits = 2; bits <= 16; bits += 2) {
        const x = xScale(bits);
        svg += `<text class="chart-axis-label" x="${x}" y="${height - padding.bottom + 15}" text-anchor="middle">${bits}</text>`;
    }

    // Y-axis values
    for (let i = 0; i <= 5; i++) {
        const val = ((i / 5) * yMax).toFixed(1);
        const y = padding.top + (i / 5) * chartHeight;
        svg += `<text class="chart-axis-label" x="${padding.left - 8}" y="${y + 4}" text-anchor="end">${val}</text>`;
    }

    svg += '</svg>';
    container.innerHTML = svg;

    renderLegend('bvChartLegend', datasets.map(d => ({ color: d.color, label: d.name })));
}

// ===== Bitwidth vs PPL Line Chart =====
function renderBitwidthPplChart() {
    const container = document.getElementById('bitwidthPplChart');
    if (!container) return;

    const currentModel = selectedModel || { name: 'Llama-2-7B', params: '7B', type: 'chat' };
    const compareName = document.getElementById('compareModelSelect')?.value;

    const datasets = [{
        name: currentModel.name,
        color: getModelColor(currentModel.name),
        data: []
    }];

    for (let bits = 2; bits <= 16; bits++) {
        const result = QuantCalculator.calculateAll(currentModel, bits, { gpu: 'RTX 4090' });
        datasets[0].data.push({
            bitWidth: bits,
            ppl: parseFloat(result.accuracy.ppl)
        });
    }

    if (compareName) {
        const compareModel = models.find(m => m.name === compareName) || { name: compareName, params: '7B', type: 'chat' };
        datasets.push({
            name: compareName,
            color: getModelColor(compareName),
            data: []
        });
        for (let bits = 2; bits <= 16; bits++) {
            const result = QuantCalculator.calculateAll(compareModel, bits, { gpu: 'RTX 4090' });
            datasets[1].data.push({
                bitWidth: bits,
                ppl: parseFloat(result.accuracy.ppl)
            });
        }
    }

    const width = container.offsetWidth || 600;
    const height = container.offsetHeight || 300;
    const padding = { top: 30, right: 30, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const xMax = 16;
    const yMax = Math.max(...datasets.map(d => Math.max(...d.data.map(p => p.ppl)))) * 1.1;
    const yMin = Math.min(...datasets.map(d => Math.min(...d.data.map(p => p.ppl)))) * 0.9;

    const xScale = (x) => padding.left + ((x - 2) / (xMax - 2)) * chartWidth;
    const yScale = (y) => padding.top + chartHeight - ((y - yMin) / (yMax - yMin)) * chartHeight;

    let svg = `<svg class="chart-svg" viewBox="0 0 ${width} ${height}">`;

    // Grid
    for (let i = 0; i <= 5; i++) {
        const x = padding.left + (i / 5) * chartWidth;
        const y = padding.top + (i / 5) * chartHeight;
        svg += `<line class="chart-grid" x1="${x}" y1="${padding.top}" x2="${x}" y2="${height - padding.bottom}"/>`;
        svg += `<line class="chart-grid" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"/>`;
    }

    // Axes
    svg += `<line class="chart-axis" x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}"/>`;
    svg += `<line class="chart-axis" x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}"/>`;

    svg += `<text class="chart-axis-label" x="${width / 2}" y="${height - 5}" text-anchor="middle">量化位宽 (bit)</text>`;
    svg += `<text class="chart-axis-label" x="10" y="${height / 2}" text-anchor="middle" transform="rotate(-90, 10, ${height / 2})">困惑度 (PPL)</text>`;

    datasets.forEach(dataset => {
        const points = dataset.data.map(d => `${xScale(d.bitWidth)},${yScale(d.ppl)}`).join(' ');
        svg += `<polyline class="chart-line" points="${points}" stroke="${dataset.color}"/>`;

        dataset.data.forEach(d => {
            const x = xScale(d.bitWidth);
            const y = yScale(d.ppl);
            svg += `<circle class="chart-point" cx="${x}" cy="${y}" r="4" fill="${dataset.color}"/>`;
        });
    });

    for (let bits = 2; bits <= 16; bits += 2) {
        const x = xScale(bits);
        svg += `<text class="chart-axis-label" x="${x}" y="${height - padding.bottom + 15}" text-anchor="middle">${bits}</text>`;
    }

    for (let i = 0; i <= 5; i++) {
        const val = (yMin + (i / 5) * (yMax - yMin)).toFixed(1);
        const y = padding.top + (i / 5) * chartHeight;
        svg += `<text class="chart-axis-label" x="${padding.left - 8}" y="${y + 4}" text-anchor="end">${val}</text>`;
    }

    svg += '</svg>';
    container.innerHTML = svg;

    renderLegend('bpChartLegend', datasets.map(d => ({ color: d.color, label: d.name })));
}

// ===== Bitwidth vs Throughput Bar Chart =====
function renderBitwidthThroughputChart() {
    const container = document.getElementById('bitwidthThroughputChart');
    if (!container) return;

    const currentModel = selectedModel || { name: 'Llama-2-7B', params: '7B', type: 'chat' };

    // Generate throughput data for each bitwidth
    const bitwidths = [2, 3, 4, 6, 8, 16];
    const data = bitwidths.map(bits => {
        const result = QuantCalculator.calculateAll(currentModel, bits, {
            gpu: 'RTX 4060 Ti',
            quantMethod: 'AWQ'
        });
        return {
            bitWidth: bits,
            speed: parseFloat(result.speed.speed),
            size: parseFloat(result.size.quantized),
            canRun: parseFloat(result.memory.totalUsed) <= 8
        };
    });

    const width = container.offsetWidth || 600;
    const height = container.offsetHeight || 300;
    const padding = { top: 30, right: 30, bottom: 50, left: 55 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const barWidth = chartWidth / data.length * 0.6;
    const gap = chartWidth / data.length * 0.4;
    const yMax = Math.max(...data.map(d => d.speed)) * 1.15;

    let svg = `<svg class="chart-svg" viewBox="0 0 ${width} ${height}">`;

    // Grid lines
    for (let i = 0; i <= 5; i++) {
        const y = padding.top + (i / 5) * chartHeight;
        svg += `<line class="chart-grid" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"/>`;
        const val = Math.round(((5 - i) / 5) * yMax);
        svg += `<text class="chart-axis-label" x="${padding.left - 8}" y="${y + 4}" text-anchor="end">${val}</text>`;
    }

    // Axes
    svg += `<line class="chart-axis" x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}"/>`;
    svg += `<line class="chart-axis" x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}"/>`;

    // Axis labels
    svg += `<text class="chart-axis-label" x="${width / 2}" y="${height - 5}" text-anchor="middle">量化位宽 (bit)</text>`;
    svg += `<text class="chart-axis-label" x="12" y="${height / 2}" text-anchor="middle" transform="rotate(-90, 12, ${height / 2})">推理速度 (tok/s)</text>`;

    // Draw bars
    data.forEach((d, i) => {
        const x = padding.left + i * (barWidth + gap) + gap / 2;
        const barH = (d.speed / yMax) * chartHeight;
        const y = padding.top + chartHeight - barH;

        const color = d.canRun
            ? (d.bitWidth === 4 ? '#FF6B35' : d.bitWidth <= 3 ? '#F59E0B' : '#3B82F6')
            : '#D1D5DB';

        svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" fill="${color}" rx="4" opacity="0.85"/>`;
        // Speed label on top
        svg += `<text x="${x + barWidth / 2}" y="${y - 6}" text-anchor="middle" font-size="11" fill="#374151" font-weight="600">${d.speed.toFixed(1)}</text>`;
        // Bitwidth label at bottom
        svg += `<text x="${x + barWidth / 2}" y="${height - padding.bottom + 16}" text-anchor="middle" font-size="11" fill="#6B7280">${d.bitWidth}-bit</text>`;
        // Size label below bit label
        svg += `<text x="${x + barWidth / 2}" y="${height - padding.bottom + 30}" text-anchor="middle" font-size="9" fill="#9CA3AF">${d.size} GB</text>`;

        if (!d.canRun) {
            svg += `<text x="${x + barWidth / 2}" y="${y + barH / 2}" text-anchor="middle" font-size="9" fill="#EF4444" font-weight="600">OOM</text>`;
        }
        if (d.bitWidth === 4) {
            svg += `<text x="${x + barWidth / 2}" y="${y - 18}" text-anchor="middle" font-size="9" fill="#FF6B35" font-weight="700">★ 推荐</text>`;
        }
    });

    svg += '</svg>';
    container.innerHTML = svg;

    renderLegend('btChartLegend', [
        { color: '#FF6B35', label: '推荐位宽 (4-bit)' },
        { color: '#3B82F6', label: '其他可部署位宽' },
        { color: '#D1D5DB', label: '显存不足 (OOM)' }
    ]);
}

// ===== Sequence Length vs Latency Chart =====
function renderSeqlenLatencyChart() {
    const container = document.getElementById('seqlenLatencyChart');
    if (!container) return;

    const currentModel = selectedModel || { name: 'Llama-2-7B', params: '7B', type: 'chat' };
    const seqLengths = [32, 64, 128, 256, 512, 1024];

    // Generate data for multiple quantization strategies
    const strategies = [
        { name: 'FP16 (RTX 4090参考)', color: '#9CA3AF', dash: '6,3', bits: 16, gpu: 'RTX 4090' },
        { name: '均匀INT4', color: '#3B82F6', dash: '', bits: 4, gpu: 'RTX 4060 Ti' },
        { name: 'FAMPWQ混合精度', color: '#EF4444', dash: '', bits: 4, gpu: 'RTX 4060 Ti', overhead: 1.05 },
        { name: '量子优化混合精度', color: '#10B981', dash: '', bits: 4, gpu: 'RTX 4060 Ti', overhead: 1.025 }
    ];

    const datasets = strategies.map(s => {
        const result = QuantCalculator.calculateAll(currentModel, s.bits, {
            gpu: s.gpu,
            quantMethod: 'AWQ'
        });
        const baseSpeed = parseFloat(result.speed.speed);
        const adjustedSpeed = baseSpeed / (s.overhead || 1);
        const perTokenMs = 1000 / adjustedSpeed;

        return {
            name: s.name,
            color: s.color,
            dash: s.dash,
            data: seqLengths.map(len => ({
                seqLen: len,
                latency: Math.round(perTokenMs * len)
            }))
        };
    });

    const width = container.offsetWidth || 600;
    const height = container.offsetHeight || 300;
    const padding = { top: 30, right: 30, bottom: 40, left: 55 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const xMax = 1024;
    const yMax = Math.max(...datasets.flatMap(d => d.data.map(p => p.latency))) * 1.1;

    const xScale = (x) => padding.left + (x / xMax) * chartWidth;
    const yScale = (y) => padding.top + chartHeight - (y / yMax) * chartHeight;

    let svg = `<svg class="chart-svg" viewBox="0 0 ${width} ${height}">`;

    // Grid
    for (let i = 0; i <= 5; i++) {
        const y = padding.top + (i / 5) * chartHeight;
        svg += `<line class="chart-grid" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"/>`;
        const val = Math.round(((5 - i) / 5) * yMax);
        svg += `<text class="chart-axis-label" x="${padding.left - 8}" y="${y + 4}" text-anchor="end">${val}</text>`;
    }

    // Axes
    svg += `<line class="chart-axis" x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}"/>`;
    svg += `<line class="chart-axis" x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}"/>`;

    svg += `<text class="chart-axis-label" x="${width / 2}" y="${height - 5}" text-anchor="middle">输出Token数</text>`;
    svg += `<text class="chart-axis-label" x="12" y="${height / 2}" text-anchor="middle" transform="rotate(-90, 12, ${height / 2})">推理延迟 (ms)</text>`;

    // X-axis values
    seqLengths.forEach(len => {
        const x = xScale(len);
        svg += `<text class="chart-axis-label" x="${x}" y="${height - padding.bottom + 15}" text-anchor="middle">${len}</text>`;
    });

    // Draw lines for each strategy
    datasets.forEach(dataset => {
        const points = dataset.data.map(d => `${xScale(d.seqLen)},${yScale(d.latency)}`).join(' ');
        const dashAttr = dataset.dash ? ` stroke-dasharray="${dataset.dash}"` : '';
        svg += `<polyline class="chart-line" points="${points}" stroke="${dataset.color}"${dashAttr}/>`;

        dataset.data.forEach(d => {
            const x = xScale(d.seqLen);
            const y = yScale(d.latency);
            svg += `<circle class="chart-point" cx="${x}" cy="${y}" r="3.5" fill="${dataset.color}"/>`;
        });
    });

    svg += '</svg>';
    container.innerHTML = svg;

    renderLegend('slChartLegend', datasets.map(d => ({ color: d.color, label: d.name })));
}

// ===== History Comparison Chart =====
function renderHistoryComparisonChart() {
    const container = document.getElementById('historyChart');
    const statsContainer = document.getElementById('historyStats');
    if (!container) return;

    const history = DataManager.getHistory();

    if (history.length === 0) {
        container.innerHTML = `
            <div class="chart-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>
                <p>暂无历史数据</p>
                <span>运行量化任务后会显示在这里</span>
            </div>
        `;
        if (statsContainer) statsContainer.innerHTML = '';
        return;
    }

    // Group history by model
    const modelGroups = {};
    history.forEach((h, i) => {
        if (!modelGroups[h.modelName]) {
            modelGroups[h.modelName] = {
                name: h.modelName,
                color: getModelColor(h.modelName),
                data: []
            };
        }
        modelGroups[h.modelName].data.push({
            index: i + 1,
            bitWidth: h.bitWidth,
            accuracy: parseFloat(h.metrics?.accuracy?.replace('%', '')) || 95,
            speed: parseFloat(h.metrics?.speed?.replace(' tok/s', '')) || 50,
            vram: parseFloat(h.metrics?.vram?.split('/')[0]) || 6,
            timestamp: new Date(h.timestamp)
        });
    });

    const width = container.offsetWidth || 600;
    const height = container.offsetHeight || 250;
    const padding = { top: 30, right: 30, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxIndex = history.length;
    const maxSpeed = Math.max(...Object.values(modelGroups).flatMap(g => g.data.map(d => d.speed))) * 1.1;

    const xScale = (i) => padding.left + ((i - 1) / maxIndex) * chartWidth;
    const yScale = (s) => padding.top + chartHeight - (s / maxSpeed) * chartHeight;

    let svg = `<svg class="chart-svg" viewBox="0 0 ${width} ${height}">`;

    // Grid
    for (let i = 0; i <= 5; i++) {
        const y = padding.top + (i / 5) * chartHeight;
        svg += `<line class="chart-grid" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"/>`;
    }

    // Axes
    svg += `<line class="chart-axis" x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}"/>`;
    svg += `<line class="chart-axis" x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}"/>`;

    // Y-axis
    for (let i = 0; i <= 5; i++) {
        const val = Math.round((i / 5) * maxSpeed);
        const y = padding.top + (i / 5) * chartHeight;
        svg += `<text class="chart-axis-label" x="${padding.left - 8}" y="${y + 4}" text-anchor="end">${val}</text>`;
    }

    // X-axis (show indices)
    const step = Math.ceil(maxIndex / 6);
    for (let i = 1; i <= maxIndex; i += step) {
        const x = xScale(i);
        svg += `<text class="chart-axis-label" x="${x}" y="${height - 10}" text-anchor="middle">#${i}</text>`;
    }

    // Draw lines for each model
    Object.values(modelGroups).forEach(group => {
        // Sort by index
        group.data.sort((a, b) => a.index - b.index);

        const points = group.data.map(d => `${xScale(d.index)},${yScale(d.speed)}`).join(' ');
        svg += `<polyline class="history-line" points="${points}" stroke="${group.color}"/>`;

        group.data.forEach(d => {
            const x = xScale(d.index);
            const y = yScale(d.speed);
            svg += `<circle class="history-point" cx="${x}" cy="${y}" r="4" fill="${group.color}"/>`;
        });
    });

    svg += '</svg>';
    container.innerHTML = svg;

    // Stats
    if (statsContainer) {
        const stats = Object.values(modelGroups).map(group => {
            const avgSpeed = (group.data.reduce((sum, d) => sum + d.speed, 0) / group.data.length).toFixed(1);
            const runCount = group.data.length;
            return { color: group.color, name: group.name, avgSpeed, runCount };
        });

        statsContainer.innerHTML = stats.map(s => `
            <div class="history-stat-item">
                <div class="history-stat-color" style="background: ${s.color}"></div>
                <div class="history-stat-info">
                    <div class="history-stat-label">${s.name} (${s.runCount}次)</div>
                    <div class="history-stat-value">平均 ${s.avgSpeed} tok/s</div>
                </div>
            </div>
        `).join('');
    }
}

// ===== Helper Functions =====
function renderLegend(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = items.map(item => `
        <div class="legend-item">
            <div class="legend-line" style="background: ${item.color}"></div>
            <span>${item.label}</span>
        </div>
    `).join('');
}

// ===== Documentation Modal =====
function initDocsModal() {
    const docsLink = document.getElementById('docsLink');
    const docsModal = document.getElementById('docsModal');
    const closeDocsModal = document.getElementById('closeDocsModal');
    const navItems = document.querySelectorAll('.docs-nav-item');
    const sections = document.querySelectorAll('.docs-section');

    if (!docsLink || !docsModal) return;

    // Open modal
    docsLink.addEventListener('click', (e) => {
        e.preventDefault();
        docsModal.style.display = 'flex';
    });

    // Close modal
    closeDocsModal.addEventListener('click', () => {
        docsModal.style.display = 'none';
    });

    // Close on overlay click
    docsModal.addEventListener('click', (e) => {
        if (e.target === docsModal) docsModal.style.display = 'none';
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && docsModal.style.display === 'flex') {
            docsModal.style.display = 'none';
        }
    });

    // Smooth scroll navigation
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);

            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });

                // Update active state
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            }
        });
    });

    // Update active nav on scroll
    const content = document.querySelector('.docs-content');
    if (content) {
        content.addEventListener('scroll', () => {
            let current = '';

            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (content.scrollTop >= sectionTop - 100) {
                    current = section.getAttribute('id');
                }
            });

            navItems.forEach(item => {
                item.classList.toggle('active', item.getAttribute('href') === `#${current}`);
            });
        });
    }
}

// ===== Model Grid =====
function initModelGrid() {
    renderModels(models);
}

function renderModels(modelList) {
    modelGrid.innerHTML = modelList.map(model => `
        <div class="model-card" data-id="${model.id}">
            <div class="model-card-header">
                <div class="model-icon">${model.name.charAt(0)}</div>
                <span class="model-badge">${model.params}</span>
            </div>
            <div class="model-name">
                ${model.name}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
            </div>
            <div class="model-meta">${model.org} · ${model.type}</div>
            <div class="model-tags">
                ${model.tags.slice(0, 2).map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
    `).join('');

    // Add click handlers
    document.querySelectorAll('.model-card').forEach(card => {
        card.addEventListener('click', () => selectModel(parseInt(card.dataset.id)));
    });
}

function selectModel(modelId) {
    selectedModel = models.find(m => m.id === modelId);

    // Update UI
    document.querySelectorAll('.model-card').forEach(card => {
        card.classList.toggle('selected', parseInt(card.dataset.id) === modelId);
    });
}

// ===== Search =====
function initSearch() {
    modelSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = models.filter(model =>
            model.name.toLowerCase().includes(query) ||
            model.org.toLowerCase().includes(query) ||
            model.tags.some(tag => tag.toLowerCase().includes(query))
        );
        renderModels(filtered);
    });
}

// ===== Bit Slider =====
function initBitSlider() {
    bitSlider.addEventListener('input', (e) => {
        const bits = parseInt(e.target.value);
        updateBitDisplay(bits);
    });
}

function updateBitDisplay(bits) {
    bitValue.textContent = `${bits} bit`;
    bitDesc.textContent = bitDescriptions[bits] || '';

    // Update active preset
    presetBtns.forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.bits) === bits);
    });
}

// ===== Presets =====
function initPresets() {
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const bits = parseInt(btn.dataset.bits);
            bitSlider.value = bits;
            updateBitDisplay(bits);
        });
    });
}

// ===== Advanced Toggle =====
function initAdvancedToggle() {
    toggleAdvanced.addEventListener('click', () => {
        const isExpanded = advancedOptions.style.display !== 'none';
        advancedOptions.style.display = isExpanded ? 'none' : 'block';
        toggleAdvanced.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
    });
}

// ===== Template Tabs =====
function initTemplateTabs() {
    templateTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            templateTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTemplate = tab.dataset.template;

            if (currentTemplate !== 'custom' && templates[currentTemplate]) {
                promptInput.value = templates[currentTemplate];
                updateCharCount();
            }
        });
    });
}

// ===== Prompt Input =====
function initPromptInput() {
    promptInput.addEventListener('input', updateCharCount);
}

function updateCharCount() {
    const count = promptInput.value.length;
    charCount.textContent = `${count} / 4096`;

    // Switch to custom template if user types
    if (currentTemplate !== 'custom' && count > 0 && promptInput.value !== templates[currentTemplate]) {
        templateTabs.forEach(t => t.classList.remove('active'));
        document.querySelector('[data-template="custom"]').classList.add('active');
        currentTemplate = 'custom';
    }
}

// ===== Run Button =====
function initRunButton() {
    runBtn.addEventListener('click', runQuantization);
}

// ===== GPU Tabs =====
function initGPUTabs() {
    const gpuTabs = document.querySelectorAll('.gpu-tab');
    const gpuCards = document.querySelectorAll('.gpu-card');

    gpuTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const series = tab.dataset.series;

            // Update tab active state
            gpuTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Filter GPU cards
            gpuCards.forEach(card => {
                if (series === 'all') {
                    card.classList.remove('hidden');
                } else if (card.classList.contains(series)) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });
}

// ===== User & Auth =====
function initUserAuth() {
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const closeLoginModal = document.getElementById('closeLoginModal');
    const doLogin = document.getElementById('doLogin');
    const userPanel = document.getElementById('userPanel');
    const closeUserPanel = document.getElementById('closeUserPanel');
    const doLogout = document.getElementById('doLogout');
    const exportData = document.getElementById('exportData');
    const clearData = document.getElementById('clearData');
    const historyPanel = document.getElementById('historyPanel');
    const closeHistoryPanel = document.getElementById('closeHistoryPanel');
    const clearHistoryBtn = document.getElementById('clearHistory');

    // Open login modal
    loginBtn.addEventListener('click', () => {
        const user = DataManager.getUser();
        if (user) {
            showUserPanel();
        } else {
            loginModal.style.display = 'flex';
        }
    });

    // Close login modal
    closeLoginModal.addEventListener('click', () => {
        loginModal.style.display = 'none';
    });

    // Do login
    doLogin.addEventListener('click', () => {
        const username = document.getElementById('username').value.trim();
        if (username) {
            DataManager.saveUser({ username, avatar: username.charAt(0).toUpperCase() });
            loginModal.style.display = 'none';
            updateLoginButton();
            showUserPanel();
        }
    });

    // Enter key to login
    document.getElementById('password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') doLogin.click();
    });

    // Close user panel
    closeUserPanel.addEventListener('click', () => {
        userPanel.style.display = 'none';
    });

    // Logout
    doLogout.addEventListener('click', () => {
        DataManager.logout();
        userPanel.style.display = 'none';
        updateLoginButton();
    });

    // Export data
    exportData.addEventListener('click', () => {
        DataManager.exportAllData();
    });

    // Clear all data
    clearData.addEventListener('click', () => {
        if (confirm('确定要清空所有数据吗？此操作不可恢复。')) {
            DataManager.clearAllData();
            updateUserStats();
            alert('数据已清空');
        }
    });

    // Open history panel
    const historyMenuItem = document.querySelector('[data-action="history"]');
    if (historyMenuItem) {
        historyMenuItem.addEventListener('click', () => {
            showHistoryPanel();
        });
    }

    // Close history panel
    closeHistoryPanel.addEventListener('click', () => {
        historyPanel.style.display = 'none';
    });

    // Clear history
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('确定要清空所有历史记录吗？')) {
            DataManager.clearHistory();
            renderHistoryList();
            updateUserStats();
        }
    });

    // Close modals on overlay click
    loginModal.addEventListener('click', (e) => {
        if (e.target === loginModal) loginModal.style.display = 'none';
    });
    userPanel.addEventListener('click', (e) => {
        if (e.target === userPanel) userPanel.style.display = 'none';
    });
    historyPanel.addEventListener('click', (e) => {
        if (e.target === historyPanel) historyPanel.style.display = 'none';
    });

    // Check login state
    updateLoginButton();
}

function updateLoginButton() {
    const loginBtn = document.getElementById('loginBtn');
    const user = DataManager.getUser();
    if (user) {
        loginBtn.textContent = user.username;
        loginBtn.style.display = 'flex';
        loginBtn.style.alignItems = 'center';
        loginBtn.style.gap = '8px';
    } else {
        loginBtn.textContent = '登录';
    }
}

function showUserPanel() {
    const user = DataManager.getUser();
    if (!user) return;

    document.getElementById('userAvatar').textContent = user.avatar || user.username.charAt(0).toUpperCase();
    document.getElementById('userName').textContent = user.username;
    document.getElementById('userLoginTime').textContent = `登录时间: ${new Date(user.loginTime).toLocaleString('zh-CN')}`;

    updateUserStats();

    document.getElementById('userPanel').style.display = 'flex';
}

function updateUserStats() {
    const history = DataManager.getHistory();
    const savedModels = DataManager.getSavedModels();
    document.getElementById('historyCount').textContent = history.length;
    document.getElementById('savedCount').textContent = savedModels.length;
}

function showHistoryPanel() {
    renderHistoryList();
    document.getElementById('historyPanel').style.display = 'flex';
}

function renderHistoryList() {
    const historyList = document.getElementById('historyList');
    const history = DataManager.getHistory();

    if (history.length === 0) {
        historyList.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>
                <p>暂无历史记录</p>
                <span>运行量化任务后会显示在这里</span>
            </div>
        `;
        return;
    }

    historyList.innerHTML = history.map(item => `
        <div class="history-item" data-id="${item.id}">
            <div class="history-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
            </div>
            <div class="history-content">
                <div class="history-title">${item.modelName}</div>
                <div class="history-meta">
                    <span>${item.modelParams}</span>
                    <span>${item.bitWidth}-bit</span>
                    <span>${new Date(item.timestamp).toLocaleString('zh-CN')}</span>
                </div>
            </div>
            <button class="history-delete" onclick="deleteHistoryItem(${item.id})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
    `).join('');
}

function deleteHistoryItem(id) {
    DataManager.deleteHistory(id);
    renderHistoryList();
    updateUserStats();
}

// Make function globally available
window.deleteHistoryItem = deleteHistoryItem;

async function runQuantization() {
    if (!selectedModel) {
        alert('请先选择一个模型');
        return;
    }

    if (isRunning) return;
    isRunning = true;

    // Show loading overlay
    loadingOverlay.style.display = 'flex';

    // Simulate progress
    const stages = [
        { progress: 10, text: '加载模型...' },
        { progress: 25, text: '分析模型结构...' },
        { progress: 40, text: '计算量化参数...' },
        { progress: 55, text: '执行量化计算...' },
        { progress: 70, text: '保存量化模型...' },
        { progress: 85, text: '编译优化...' },
        { progress: 95, text: '准备推理环境...' },
        { progress: 100, text: '完成！' }
    ];

    for (const stage of stages) {
        await sleep(400);
        progressFill.style.width = `${stage.progress}%`;
        document.querySelector('.loading-text').textContent = stage.text;
    }

    await sleep(500);

    // Hide loading
    loadingOverlay.style.display = 'none';
    isRunning = false;

    // Save to history
    const currentBitWidth = parseInt(bitSlider.value);

    // 使用量化计算引擎获取准确结果
    const calcResult = QuantCalculator.calculateAll(
        selectedModel,
        currentBitWidth,
        { gpu: 'RTX 4090', quantMethod: 'GPTQ' }
    );

    // 更新显示的值
    updateResultsDisplay(calcResult);

    DataManager.addHistory({
        modelId: selectedModel.id,
        modelName: selectedModel.name,
        modelParams: selectedModel.params,
        bitWidth: currentBitWidth,
        promptLength: promptInput.value.length,
        resultLength: 256,
        duration: parseFloat(calcResult.latency.totalFor100) / 10,
        metrics: {
            compression: calcResult.size.savingsPercent,
            speed: calcResult.speed.speed,
            ppl: calcResult.accuracy.ppl,
            accuracy: calcResult.accuracy.accuracy,
            vram: `${calcResult.memory.totalUsed}GB / ${calcResult.memory.totalVram}GB`,
            efficiency: calcResult.efficiency.gain,
            ttft: calcResult.latency.ttft
        }
    });

    // Add to recent models
    DataManager.addRecentModel(selectedModel);

    // Show results
    showResults();
}

function showResults() {
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });

    // Update stats with animation
    animateValue('.stat-value', 0);
}

/**
 * 使用计算引擎更新结果展示
 * @param {Object} result - QuantCalculator计算结果
 */
function updateResultsDisplay(result) {
    // 更新各统计卡片
    const modelSizeValue = document.getElementById('modelSizeValue');
    const modelSizeChange = document.getElementById('modelSizeChange');
    const latencyValue = document.getElementById('latencyValue');
    const latencyChange = document.getElementById('latencyChange');
    const speedValue = document.getElementById('speedValue');
    const speedChange = document.getElementById('speedChange');
    const pplValue = document.getElementById('pplValue');
    const pplChange = document.getElementById('pplChange');

    if (modelSizeValue) modelSizeValue.textContent = result.size.totalSize + ' GB';
    if (modelSizeChange) modelSizeChange.textContent = `压缩率 ${result.size.savingsPercent}%`;

    if (latencyValue) latencyValue.textContent = result.latency.ttft + 's';
    if (latencyChange) latencyChange.textContent = result.latency.status === 'realtime' ? '实时交互' : '可交互';

    if (speedValue) speedValue.textContent = result.speed.speed + ' tok/s';
    if (speedChange) speedChange.textContent = `提升 ${result.speed.speedup}`;

    if (pplValue) pplValue.textContent = result.accuracy.ppl;
    if (pplChange) pplChange.textContent = `精度损失 ${result.accuracy.accuracyLoss}%`;

    // 更新综合评分
    updateScoreDisplay(result);

    // 更新推理成本可视化
    updateCostVisualization(result);

    // 更新显卡对比数据
    updateGPUComparison(result);
}

/**
 * 更新综合评分显示
 * @param {Object} result - 计算结果
 */
function updateScoreDisplay(result) {
    const score = parseInt(result.score);
    const scoreNumber = document.getElementById('scoreNumber');
    const scoreRing = document.getElementById('scoreRing');
    const scoreBadge = document.getElementById('scoreBadge');
    const scoreAccuracy = document.getElementById('scoreAccuracy');
    const scoreSpeed = document.getElementById('scoreSpeed');
    const scoreMemory = document.getElementById('scoreMemory');

    // 评分等级
    let badge = '良好';
    if (score >= 90) badge = '优秀';
    else if (score >= 75) badge = '良好';
    else if (score >= 60) badge = '一般';
    else badge = '较差';

    // 更新徽章
    if (scoreBadge) {
        scoreBadge.textContent = badge;
        scoreBadge.style.background = score >= 75 ? '#D1FAE5' :
                                       score >= 60 ? '#FEF3C7' : '#FEE2E2';
        scoreBadge.style.color = score >= 75 ? '#059669' :
                                 score >= 60 ? '#D97706' : '#DC2626';
    }

    // 数字动画
    if (scoreNumber) {
        animateNumberValue(scoreNumber, 0, score, 1000);
    }

    // 环形进度动画 (stroke-dashoffset: 283 - 283 * percent)
    if (scoreRing) {
        setTimeout(() => {
            const offset = 283 - (283 * score / 100);
            scoreRing.style.strokeDashoffset = offset;
        }, 100);
    }

    // 细分评分
    if (scoreAccuracy) {
        scoreAccuracy.textContent = result.accuracy.accuracy + '%';
        scoreAccuracy.style.color = result.accuracy.accuracyPercent > 0.95 ? '#059669' : '#D97706';
    }
    if (scoreSpeed) {
        scoreSpeed.textContent = result.speed.speed + ' tok/s';
        scoreSpeed.style.color = parseFloat(result.speed.speed) > 50 ? '#059669' : '#D97706';
    }
    if (scoreMemory) {
        const usage = parseFloat(result.memory.usagePercent);
        scoreMemory.textContent = result.memory.totalUsed + 'GB';
        scoreMemory.style.color = usage < 50 ? '#059669' : usage < 80 ? '#D97706' : '#DC2626';
    }
}

/**
 * 数字动画
 * @param {HTMLElement} element - 元素
 * @param {number} start - 起始值
 * @param {number} end - 结束值
 * @param {number} duration - 持续时间(ms)
 */
function animateNumberValue(element, start, end, duration) {
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (end - start) * eased);

        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

/**
 * 更新推理成本可视化区域
 * @param {Object} result - 计算结果
 */
function updateCostVisualization(result) {
    // 显存占用
    const vramUsage = document.getElementById('vramUsage');
    const vramBar = document.getElementById('vramBar');
    const vramHint = document.getElementById('vramHint');

    if (vramUsage) vramUsage.textContent = result.memory.totalUsed + ' GB';
    if (vramBar) vramBar.style.width = Math.min(parseFloat(result.memory.usagePercent), 100) + '%';
    if (vramHint) {
        vramHint.textContent = result.memory.recommended === 'optimal' ? '显存充裕' :
                              result.memory.recommended === 'good' ? '可正常运行' : '显存紧张';
    }

    // 推理速度
    const speedValue = document.getElementById('inferenceSpeed');
    const speedBar = document.getElementById('speedBar');
    const speedHint = document.getElementById('speedHint');

    if (speedValue) speedValue.textContent = result.speed.speed + ' tok/s';
    if (speedBar) {
        const speedPercent = Math.min(parseFloat(result.speed.speed), 100);
        speedBar.style.width = speedPercent + '%';
    }
    if (speedHint) speedHint.textContent = `提升 ${result.speed.speedup}`;

    // TTFT延迟
    const ttftElement = document.getElementById('ttftLatency');
    const latencyBar = document.getElementById('latencyBar');
    const latencyHint = document.getElementById('latencyHint');

    if (ttftElement) ttftElement.textContent = result.latency.ttft + 's';
    if (latencyBar) {
        const latencyPercent = Math.max(0, 100 - parseFloat(result.latency.ttft) * 20);
        latencyBar.style.width = latencyPercent + '%';
    }
    if (latencyHint) {
        latencyHint.textContent = result.latency.status === 'realtime' ? '实时交互' :
                                  result.latency.status === 'interactive' ? '可交互' : '批处理';
    }

    // 能效比
    const effElement = document.getElementById('efficiency');
    const effBar = document.getElementById('efficiencyBar');
    const effHint = document.getElementById('efficiencyHint');

    if (effElement) effElement.textContent = result.efficiency.efficiency + ' ' + result.efficiency.unit;
    if (effBar) {
        const effPercent = Math.min(parseFloat(result.efficiency.efficiency) * 1, 100);
        effBar.style.width = effPercent + '%';
    }
    if (effHint) effHint.textContent = `提升 ${result.efficiency.gain}`;

    // Refresh charts with new data
    renderAllCharts();
}

/**
 * 更新显卡性能对比
 * @param {Object} currentResult - 当前配置的计算结果
 */
function updateGPUComparison(currentResult) {
    // 计算所有显卡的性能
    const gpuResults = QuantCalculator.compareGPUs(
        selectedModel || { name: 'Llama-2-7B', params: '7B', type: 'chat' },
        parseInt(bitSlider.value) || 4,
        { quantMethod: 'GPTQ' }
    );

    // 更新各显卡卡片
    const gpuCards = document.querySelectorAll('.gpu-card');
    const maxSpeed = Math.max(...gpuResults.map(r => parseFloat(r.speed.speed)));

    gpuCards.forEach((card, index) => {
        const result = gpuResults[index];
        if (!result) return;

        // 更新排名
        const rank = card.querySelector('.gpu-rank');
        if (rank) rank.textContent = index + 1;

        // 更新名称和规格
        const name = card.querySelector('.gpu-name');
        if (name) name.textContent = result.gpu;

        // 更新速度
        const speedValue = card.querySelector('.gpu-metric:nth-child(1) .metric-value');
        if (speedValue) speedValue.textContent = result.speed.speed + ' tok/s';

        // 更新速度进度条
        const speedBar = card.querySelector('.gpu-metric:nth-child(1) .metric-fill');
        if (speedBar) {
            const percent = (parseFloat(result.speed.speed) / maxSpeed * 100).toFixed(0);
            speedBar.style.width = percent + '%';
        }

        // 更新显存
        const vramValue = card.querySelector('.gpu-metric:nth-child(2) .metric-value');
        if (vramValue) vramValue.textContent = `${result.memory.totalUsed}GB / ${result.memory.totalVram}GB`;

        const vramBar = card.querySelector('.gpu-metric:nth-child(2) .metric-fill');
        if (vramBar) {
            vramBar.style.width = result.memory.usagePercent + '%';
        }

        // 更新功耗
        const powerValue = card.querySelector('.gpu-metric:nth-child(3) .metric-value');
        if (powerValue) powerValue.textContent = result.efficiency.power + 'W';

        // 更新推荐标签
        const badge = card.querySelector('.metric-badge');
        if (badge) {
            if (result.gpu === 'RTX 4090') {
                badge.textContent = '推荐';
                badge.classList.add('optimal');
            } else if (result.gpu.includes('A100') || result.gpu.includes('L40S')) {
                badge.textContent = '数据中心';
            } else {
                badge.textContent = result.memory.canRun ? '可用' : '不可用';
            }
        }
    });

    // 更新横向对比图表
    updateComparisonChart(gpuResults);
}

/**
 * 更新横向对比图表
 * @param {Array} gpuResults - 显卡计算结果数组
 */
function updateComparisonChart(gpuResults) {
    const maxSpeed = Math.max(...gpuResults.map(r => parseFloat(r.speed.speed)));
    const rows = document.querySelectorAll('.h-bar-row');

    gpuResults.forEach((result, index) => {
        if (rows[index]) {
            const label = rows[index].querySelector('.h-bar-label');
            const bar = rows[index].querySelector('.h-bar-fill');
            const value = rows[index].querySelector('.h-bar-value');

            if (label) label.textContent = result.gpu;
            if (bar) {
                const percent = (parseFloat(result.speed.speed) / maxSpeed * 100).toFixed(0);
                bar.style.width = percent + '%';
                if (result.gpu.includes('A100') || result.gpu.includes('L40S')) {
                    bar.classList.add('premium');
                }
            }
            if (value) value.textContent = result.speed.speed + ' tok/s';
        }
    });
}

// ===== Utility =====
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function animateValue(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
        const finalText = el.textContent;
        if (finalText.includes('GB') || finalText.includes('s') || finalText.includes('tok/s') || finalText.includes('%')) {
            // Animate number
            const numMatch = finalText.match(/[\d.]+/);
            if (numMatch) {
                const num = parseFloat(numMatch[0]);
                animateNumber(el, 0, num, 1000, finalText.replace(numMatch[0], ''));
            }
        }
    });
}

function animateNumber(element, start, end, duration, suffix) {
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = start + (end - start) * eased;

        if (suffix.includes('%') && progress < 1) {
            element.textContent = `${Math.round(current)}${suffix}`;
        } else if (progress < 1) {
            element.textContent = `${current.toFixed(1)}${suffix}`;
        } else {
            element.textContent = finalValue(element);
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function finalValue(element) {
    // 获取当前配置的计算结果
    const currentBitWidth = parseInt(bitSlider.value) || 4;
    const model = selectedModel || { name: 'Llama-2-7B', params: '7B', type: 'chat' };

    const result = QuantCalculator.calculateAll(model, currentBitWidth, {
        gpu: 'RTX 4090',
        quantMethod: 'GPTQ'
    });

    const parent = element.closest('.stat-card');
    if (!parent) return element.textContent;

    const label = parent.querySelector('.stat-label').textContent;

    if (label.includes('大小')) return result.size.totalSize + ' GB';
    if (label.includes('延迟')) return result.latency.ttft + 's';
    if (label.includes('速度')) return result.speed.speed + ' tok/s';
    if (label.includes('困惑')) return result.accuracy.ppl;

    return element.textContent;
}

// ===== Export functionality =====
document.querySelectorAll('.result-actions .btn-secondary').forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.textContent.includes('下载')) {
            alert('下载功能开发中...');
        } else if (btn.textContent.includes('复制')) {
            const content = document.querySelector('.message-content').textContent;
            navigator.clipboard.writeText(content).then(() => {
                alert('已复制到剪贴板');
            });
        }
    });
});

// ===== Page Navigation =====
function initPageNavigation() {
    console.log('initPageNavigation called');

    const navLinks = document.querySelectorAll('.nav-link[data-page]');
    const mainContent = document.querySelector('.main-content');
    const warehousePage = document.getElementById('warehousePage');
    const deployPage = document.getElementById('deployPage');

    console.log('navLinks:', navLinks.length);
    console.log('mainContent:', mainContent);
    console.log('warehousePage:', warehousePage);
    console.log('deployPage:', deployPage);

    // Set initial state - show main content, hide others
    if (mainContent) mainContent.style.display = 'block';
    if (warehousePage) warehousePage.classList.remove('active');
    if (deployPage) deployPage.classList.remove('active');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            console.log('Clicked page:', page);

            // Update nav active state
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Hide all pages first
            if (mainContent) mainContent.style.display = 'none';
            if (warehousePage) warehousePage.classList.remove('active');
            if (deployPage) deployPage.classList.remove('active');

            // Show corresponding page
            if (page === 'quantize') {
                if (mainContent) mainContent.style.display = 'block';
                console.log('Showing quantize page');
            } else if (page === 'warehouse') {
                if (warehousePage) {
                    warehousePage.classList.add('active');
                    console.log('warehousePage active class added');
                }
                initWarehousePage();
            } else if (page === 'deploy') {
                if (deployPage) deployPage.classList.add('active');
                initDeployPage();
            }
        });
    });

    // Set initial active state for quantize link
    const activeLink = document.querySelector('.nav-link[data-page="quantize"]');
    if (activeLink) {
        activeLink.classList.add('active');
        console.log('Set quantize as active');
    }
}

// ===== Warehouse Page - ModelScope Style =====
function initWarehousePage() {
    const searchInput = document.getElementById('modelscopeSearch');
    const searchBtn = document.getElementById('doSearch');
    const loadMoreBtn = document.getElementById('loadMoreBtn');

    // Search on button click
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            doModelSearch();
        });
    }

    // Search on Enter key
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                doModelSearch();
            }
        });
    }

    // Load more
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            loadMoreModels();
        });
    }

    // Filter changes
    const filterTask = document.getElementById('filterTask');
    const filterSize = document.getElementById('filterSize');
    const filterFramework = document.getElementById('filterFramework');

    [filterTask, filterSize, filterFramework].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', () => {
                doModelSearch();
            });
        }
    });

    // Initial render - fetch popular models from ModelScope
    fetchPopularModels();
}

let currentSearchResults = [];
let currentPage = 1;
const pageSize = 20;
let isLoading = false;

async function fetchPopularModels() {
    const loading = document.getElementById('searchLoading');
    const resultsCount = document.getElementById('resultsCount');

    if (loading) loading.style.display = 'flex';
    if (resultsCount) resultsCount.textContent = '加载中...';

    try {
        // Fetch from ModelScope API
        const models = await fetchFromModelScope('');
        currentSearchResults = models;
        currentPage = 1;

        if (resultsCount) resultsCount.textContent = `热门模型 (${models.length})`;
        renderModelList(models.slice(0, pageSize));

        // Show/hide load more
        const loadMoreSection = document.getElementById('loadMoreSection');
        if (loadMoreSection) {
            loadMoreSection.style.display = models.length > pageSize ? 'block' : 'none';
        }
    } catch (error) {
        console.error('Failed to fetch models:', error);
        // Fallback to local models
        const localModels = getAllModels();
        currentSearchResults = localModels;
        currentPage = 1;

        if (resultsCount) resultsCount.textContent = '热门模型';
        renderModelList(localModels.slice(0, pageSize));
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

// 切换模型类型（最新/热门/全部）
function switchModelType(type, btn) {
    // 更新标签状态
    const tabs = document.querySelectorAll('.type-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    if (btn) btn.classList.add('active');

    // 根据类型加载不同模型
    switch(type) {
        case 'latest':
            fetchLatestModels();
            break;
        case 'popular':
            fetchPopularModels();
            break;
        case 'all':
            fetchAllModels();
            break;
    }
}

// 获取最新模型（按更新时间排序）
async function fetchLatestModels() {
    const loading = document.getElementById('searchLoading');
    const resultsCount = document.getElementById('resultsCount');

    if (loading) loading.style.display = 'flex';
    if (resultsCount) resultsCount.textContent = '加载中...';

    try {
        // 从 ModelScope 获取最新模型
        const models = await fetchFromModelScope('', '', '', 'latest');
        currentSearchResults = models;
        currentPage = 1;

        if (resultsCount) resultsCount.textContent = `最新模型 (${models.length})`;
        renderModelList(models.slice(0, pageSize));

        const loadMoreSection = document.getElementById('loadMoreSection');
        if (loadMoreSection) {
            loadMoreSection.style.display = models.length > pageSize ? 'block' : 'none';
        }
    } catch (error) {
        console.error('Failed to fetch latest models:', error);
        // 按更新时间排序本地模型
        const localModels = getAllModels().sort((a, b) => {
            const dateA = new Date(a.updated || 0);
            const dateB = new Date(b.updated || 0);
            return dateB - dateA;
        });
        currentSearchResults = localModels;
        currentPage = 1;

        if (resultsCount) resultsCount.textContent = '最新模型';
        renderModelList(localModels.slice(0, pageSize));
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

// 获取全部模型
async function fetchAllModels() {
    const loading = document.getElementById('searchLoading');
    const resultsCount = document.getElementById('resultsCount');

    if (loading) loading.style.display = 'flex';
    if (resultsCount) resultsCount.textContent = '加载中...';

    try {
        const models = await fetchFromModelScope('', '', '', 'all');
        currentSearchResults = models;
        currentPage = 1;

        if (resultsCount) resultsCount.textContent = `全部模型 (${models.length})`;
        renderModelList(models.slice(0, pageSize));

        const loadMoreSection = document.getElementById('loadMoreSection');
        if (loadMoreSection) {
            loadMoreSection.style.display = models.length > pageSize ? 'block' : 'none';
        }
    } catch (error) {
        console.error('Failed to fetch all models:', error);
        const localModels = getAllModels();
        currentSearchResults = localModels;
        currentPage = 1;

        if (resultsCount) resultsCount.textContent = '全部模型';
        renderModelList(localModels.slice(0, pageSize));
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

// 从 ModelScope 刷新最新模型
async function refreshFromModelScope() {
    const refreshBtn = document.getElementById('refreshModelscope');
    const originalText = refreshBtn?.innerHTML || '';

    if (refreshBtn) {
        refreshBtn.innerHTML = '<svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg> 刷新中...';
        refreshBtn.disabled = true;
    }

    try {
        // 强制重新获取最新数据
        clearModelScopeCache();

        // 获取当前激活的标签类型
        const activeTab = document.querySelector('.type-tab.active');
        const currentType = activeTab?.dataset.type || 'popular';

        // 根据当前类型刷新
        switch(currentType) {
            case 'latest':
                await fetchLatestModels();
                break;
            case 'popular':
                await fetchPopularModels();
                break;
            case 'all':
                await fetchAllModels();
                break;
            default:
                await fetchPopularModels();
        }

        // 显示刷新成功提示
        showNotification('已刷新，获取最新模型数据', 'success');
    } catch (error) {
        console.error('Refresh failed:', error);
        showNotification('刷新失败，请稍后重试', 'error');
    } finally {
        if (refreshBtn) {
            refreshBtn.innerHTML = originalText;
            refreshBtn.disabled = false;
        }
    }
}

// 清除 ModelScope 缓存
function clearModelScopeCache() {
    const cacheKeys = Object.keys(localStorage).filter(key =>
        key.startsWith('modelscope_cache_')
    );
    cacheKeys.forEach(key => localStorage.removeItem(key));
}

// 显示通知
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(notification);

    // 3秒后自动移除
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

async function doModelSearch() {
    const searchInput = document.getElementById('modelscopeSearch');
    const filterTask = document.getElementById('filterTask');
    const filterSize = document.getElementById('filterSize');
    const loading = document.getElementById('searchLoading');
    const resultsCount = document.getElementById('resultsCount');
    const loadMoreSection = document.getElementById('loadMoreSection');

    const query = searchInput?.value.trim() || '';
    const task = filterTask?.value || '';
    const size = filterSize?.value || '';

    if (isLoading) return;
    isLoading = true;

    if (loading) loading.style.display = 'flex';

    try {
        // Fetch from ModelScope API
        const models = await fetchFromModelScope(query, task, size);

        currentSearchResults = models;
        currentPage = 1;

        // Update UI
        if (loading) loading.style.display = 'none';
        if (resultsCount) {
            resultsCount.textContent = query ? `搜索结果: ${models.length} 个模型` : '热门模型';
        }

        renderModelList(models.slice(0, pageSize));

        // Show/hide load more
        if (loadMoreSection) {
            loadMoreSection.style.display = models.length > pageSize ? 'block' : 'none';
        }
    } catch (error) {
        console.error('Search failed:', error);
        if (loading) loading.style.display = 'none';

        // Fallback to local search
        let models = getAllModels();

        if (query) {
            models = models.filter(m =>
                m.name.toLowerCase().includes(query.toLowerCase()) ||
                m.org.toLowerCase().includes(query.toLowerCase()) ||
                m.desc.toLowerCase().includes(query.toLowerCase())
            );
        }

        currentSearchResults = models;
        currentPage = 1;

        if (resultsCount) {
            resultsCount.textContent = query ? `搜索结果: ${models.length} 个模型` : '热门模型';
        }

        renderModelList(models.slice(0, pageSize));

        if (loadMoreSection) {
            loadMoreSection.style.display = models.length > pageSize ? 'block' : 'none';
        }
    } finally {
        isLoading = false;
    }
}

async function loadMoreModels() {
    if (isLoading) return;

    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const loadMoreSection = document.getElementById('loadMoreSection');

    currentPage++;
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const models = currentSearchResults.slice(0, end);

    renderModelList(models, true);

    if (end >= currentSearchResults.length) {
        if (loadMoreSection) loadMoreSection.style.display = 'none';
    }
}

// ModelScope API Integration
const ModelScopeAPI = {
    baseUrl: 'https://modelscope.cn/api/v1/models',

    async fetchModels(query = '', task = '', size = '') {
        let url = this.baseUrl;

        // Build query parameters
        const params = new URLSearchParams();
        if (query) params.append('Search', query);
        if (task) params.append('Task', task);
        params.append('Page', '1');
        params.append('Size', String(pageSize));

        url += '?' + params.toString();

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Accept-Language': 'zh-CN'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return this.parseModels(data);
        } catch (error) {
            console.warn('ModelScope API failed, using fallback:', error);
            throw error;
        }
    },

    parseModels(data) {
        if (!data || !data.Data) return [];

        const models = data.Data.map(item => ({
            id: item.ModelId || item.Id,
            name: item.ModelName || item.Name,
            org: item.Org || item.Organization || 'ModelScope',
            params: this.parseParams(item.Parameters || item.Params),
            task: item.Task || item.TaskName || 'text-generation',
            taskName: this.getTaskName(item.Task || item.TaskName),
            desc: item.Description || item.Desc || '暂无描述',
            downloads: item.Downloads || item.DownloadCount || 0,
            updated: item.UpdatedAt || item.UpdateTime || new Date().toISOString().split('T')[0],
            downloaded: false,
            url: item.Url || `https://modelscope.cn/models/${item.ModelId || item.Id}`
        }));

        return models;
    },

    parseParams(params) {
        if (!params) return '7B';
        if (typeof params === 'number') {
            if (params >= 1e9) return (params / 1e9).toFixed(0) + 'B';
            if (params >= 1e6) return (params / 1e6).toFixed(0) + 'M';
            return params + '';
        }
        if (typeof params === 'string') {
            if (params.includes('B')) return params;
            if (params.includes('M')) return params;
        }
        return '7B';
    },

    getTaskName(task) {
        const taskMap = {
            'text-generation': '文本生成',
            'text-generation-web': '对话模型',
            'text2text-generation': '文本生成',
            'conversation': '对话模型',
            'chat': '对话模型',
            'text-classification': '文本分类',
            'token-classification': '序列标注',
            'question-answering': '问答',
            'summarization': '摘要',
            'translation': '翻译',
            'code-generation': '代码生成',
            'fill-mask': '完形填空',
            'embedding': '嵌入模型',
            'image-classification': '图像分类'
        };
        return taskMap[task?.toLowerCase()] || task || '文本生成';
    }
};

// Fallback local models (12 popular models)
function getAllModels() {
    const savedModels = DataManager.getSavedModels();
    const downloadedNames = savedModels.map(m => m.modelName);

    return [
        { id: 'Qwen/Qwen-7B-Chat', name: 'Qwen-7B-Chat', org: 'Qwen', params: '7B', task: 'text-generation', taskName: '文本生成', desc: '阿里巴巴推出的大规模语言模型，支持中英文对话，在多项基准测试中表现优异。', downloads: 125000, downloaded: downloadedNames.includes('Qwen-7B-Chat'), url: 'https://modelscope.cn/models/Qwen/Qwen-7B-Chat' },
        { id: '01ai/Yi-6B-Chat', name: 'Yi-6B-Chat', org: '01-ai', params: '6B', task: 'text-generation', taskName: '文本生成', desc: '零一万物推出的中英文大语言模型，在语言理解和生成方面表现出色。', downloads: 89000, downloaded: downloadedNames.includes('Yi-6B-Chat'), url: 'https://modelscope.cn/models/01ai/Yi-6B-Chat' },
        { id: 'ZhipuAI/ChatGLM3-6B', name: 'ChatGLM3-6B', org: '智谱AI', params: '6B', task: 'text-generation', taskName: '对话模型', desc: '智谱AI推出的第三代ChatGLM模型，支持中英文对话，代码生成和推理能力增强。', downloads: 156000, downloaded: downloadedNames.includes('ChatGLM3-6B'), url: 'https://modelscope.cn/models/ZhipuAI/ChatGLM3-6B' },
        { id: 'baichuan-inc/Baichuan2-7B-Chat', name: 'Baichuan2-7B-Chat', org: '百川智能', params: '7B', task: 'text-generation', taskName: '对话模型', desc: '百川智能推出的开源大语言模型，在中文理解方面表现突出。', downloads: 67000, downloaded: downloadedNames.includes('Baichuan2-7B-Chat'), url: 'https://modelscope.cn/models/baichuan-inc/Baichuan2-7B-Chat' },
        { id: 'deepseek-ai/DeepSeek-7B-Chat', name: 'DeepSeek-7B-Chat', org: '深度求索', params: '7B', task: 'text-generation', taskName: '对话模型', desc: '深度求索推出的高性能大语言模型，代码和数学推理能力强。', downloads: 45000, downloaded: downloadedNames.includes('DeepSeek-7B-Chat'), url: 'https://modelscope.cn/models/deepseek-ai/DeepSeek-7B-Chat' },
        { id: 'mistralai/Mistral-7B-Instruct', name: 'Mistral-7B-Instruct', org: 'MistralAI', params: '7B', task: 'text-generation', taskName: '指令遵循', desc: 'Mistral AI推出的7B指令微调模型，性能超越多数同规模模型。', downloads: 234000, downloaded: downloadedNames.includes('Mistral-7B-Instruct'), url: 'https://modelscope.cn/models/mistralai/Mistral-7B-Instruct' },
        { id: 'meta-llama/Llama-2-7B-Chat', name: 'Llama-2-7B-Chat', org: 'Meta', params: '7B', task: 'text-generation', taskName: '对话模型', desc: 'Meta推出的Llama 2对话微调模型，支持商用授权。', downloads: 312000, downloaded: downloadedNames.includes('Llama-2-7B-Chat'), url: 'https://modelscope.cn/models/meta-llama/Llama-2-7B-Chat' },
        { id: 'meta-llama/CodeLlama-7B-Instruct', name: 'CodeLlama-7B-Instruct', org: 'Meta', params: '7B', task: 'code-generation', taskName: '代码生成', desc: '专门针对代码任务微调的Llama模型，支持代码补全和解释。', downloads: 178000, downloaded: downloadedNames.includes('CodeLlama-7B-Instruct'), url: 'https://modelscope.cn/models/meta-llama/CodeLlama-7B-Instruct' },
        { id: 'Qwen/Qwen-14B-Chat', name: 'Qwen-14B-Chat', org: 'Qwen', params: '14B', task: 'text-generation', taskName: '文本生成', desc: '更大规模的Qwen模型，在复杂推理任务上表现更佳。', downloads: 78000, downloaded: downloadedNames.includes('Qwen-14B-Chat'), url: 'https://modelscope.cn/models/Qwen/Qwen-14B-Chat' },
        { id: '01ai/Yi-34B-Chat', name: 'Yi-34B-Chat', org: '01-ai', params: '34B', task: 'text-generation', taskName: '对话模型', desc: 'Yi系列最大规模模型，在各项评测中接近GPT-3.5水平。', downloads: 34000, downloaded: downloadedNames.includes('Yi-34B-Chat'), url: 'https://modelscope.cn/models/01ai/Yi-34B-Chat' },
        { id: 'BAAI/Aquila-7B-Chat', name: 'Aquila-7B-Chat', org: '智源研究院', params: '7B', task: 'text-generation', taskName: '对话模型', desc: '智源研究院推出的开源大语言模型，中文能力突出。', downloads: 42000, downloaded: downloadedNames.includes('Aquila-7B-Chat'), url: 'https://modelscope.cn/models/BAAI/Aquila-7B-Chat' },
        { id: 'Shanghai_AI_Lab/InternLM-7B-Chat', name: 'InternLM-7B-Chat', org: '上海AI Lab', params: '7B', task: 'text-generation', taskName: '对话模型', desc: '上海人工智能实验室推出的对话语言模型。', downloads: 95000, downloaded: downloadedNames.includes('InternLM-7B-Chat'), url: 'https://modelscope.cn/models/Shanghai_AI_Lab/InternLM-7B-Chat' },
    ];
}

// Fetch from ModelScope API
async function fetchFromModelScope(query = '', task = '', size = '', type = '') {
    try {
        // 根据类型构建不同的API请求
        let url = 'https://modelscope.cn/api/v1/models?page=1&size=20&Status=Published';

        // 最新模型按更新时间排序
        if (type === 'latest') {
            url += '&Order=UpdatedAt&Reverse=1';
        }
        // 热门模型按下载量排序
        else if (type === 'popular') {
            url += '&Order=Downloads&Reverse=1';
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Accept-Language': 'zh-CN',
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return parseModelScopeData(data, query, task, size);
    } catch (error) {
        console.warn('ModelScope API error:', error);
        throw error;
    }
}

function parseModelScopeData(data, query, task, size) {
    if (!data || !data.Data) {
        return [];
    }

    let models = data.Data.map(item => ({
        id: item.ModelId || item.Id,
        name: item.ModelName || item.Name,
        org: item.Org || item.Organization || 'ModelScope',
        params: parseParameters(item.Parameters || item.Params),
        task: item.Task || item.TaskName || 'text-generation',
        taskName: getTaskNameZh(item.Task || item.TaskName),
        desc: item.Description || item.Desc || '暂无描述',
        downloads: item.Downloads || item.DownloadCount || 0,
        updated: item.UpdatedAt || item.UpdateTime || new Date().toISOString().split('T')[0],
        downloaded: false,
        url: `https://modelscope.cn/models/${item.ModelId || item.Id}`
    }));

    // Filter by search query
    if (query) {
        const q = query.toLowerCase();
        models = models.filter(m =>
            m.name.toLowerCase().includes(q) ||
            m.org.toLowerCase().includes(q) ||
            m.desc.toLowerCase().includes(q)
        );
    }

    // Filter by task
    if (task) {
        models = models.filter(m => m.task === task);
    }

    // Filter by size
    if (size) {
        models = models.filter(m => {
            const params = parseInt(m.params);
            if (size === '1b') return params < 3;
            if (size === '3b') return params >= 3 && params < 5;
            if (size === '7b') return params >= 5 && params < 10;
            if (size === '13b') return params >= 10 && params < 20;
            if (size === '34b') return params >= 20 && params < 50;
            if (size === '70b') return params >= 50;
            return true;
        });
    }

    return models;
}

function parseParameters(params) {
    if (!params) return '7B';
    if (typeof params === 'number') {
        if (params >= 1e9) return (params / 1e9).toFixed(0) + 'B';
        if (params >= 1e6) return (params / 1e6).toFixed(0) + 'M';
        return params + '';
    }
    if (typeof params === 'string') {
        if (params.match(/^\d+\.?\d*B$/)) return params;
        if (params.match(/^\d+\.?\d*M$/)) return params;
    }
    return '7B';
}

function getTaskNameZh(task) {
    const taskMap = {
        'text-generation': '文本生成',
        'text-generation-web': '对话模型',
        'text2text-generation': '文本生成',
        'conversation': '对话模型',
        'chat': '对话模型',
        'text-classification': '文本分类',
        'token-classification': '序列标注',
        'question-answering': '问答',
        'summarization': '摘要',
        'translation': '翻译',
        'code-generation': '代码生成',
        'fill-mask': '完形填空',
        'embedding': '嵌入模型',
        'image-classification': '图像分类'
    };
    return taskMap[task?.toLowerCase()] || task || '文本生成';
}

function renderModelList(models, append = false) {
    const container = document.getElementById('modelList');
    if (!container) return;

    if (models.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <p>未找到相关模型</p>
                <span>尝试其他搜索词或调整筛选条件</span>
            </div>
        `;
        return;
    }

    const html = models.map(model => `
        <div class="model-item" data-id="${model.id}">
            <div class="model-avatar" style="background: ${getModelColor(model.name)}">${model.name.charAt(0)}</div>
            <div class="model-info">
                <div class="model-info-header">
                    <span class="model-info-name">${model.name}</span>
                    <span class="model-info-org">by ${model.org}</span>
                </div>
                <p class="model-info-desc">${model.desc}</p>
                <div class="model-meta-tags">
                    <span class="tag">${model.params}</span>
                    <span class="tag">${model.taskName}</span>
                    <span class="tag">${(model.downloads / 1000).toFixed(0)}k 下载</span>
                    ${model.downloaded ? '<span class="tag" style="background: #D1FAE5; color: #059669;">已下载</span>' : ''}
                </div>
            </div>
            <div class="model-actions-mini">
                ${model.downloaded ?
                    `<button class="btn-primary btn-sm" onclick="deployFromSearch(${model.id})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                        部署
                    </button>` :
                    `<button class="btn-primary btn-sm" onclick="downloadFromSearch(${model.id})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        下载
                    </button>`
                }
                <button class="btn-secondary btn-sm" onclick="toggleFavFromSearch(${model.id}, this)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    收藏
                </button>
            </div>
        </div>
    `).join('');

    if (append) {
        container.insertAdjacentHTML('beforeend', html);
    } else {
        container.innerHTML = html;
    }
}

// Make globally available for onclick handlers
window.showLocalModels = function() {
    const models = getLocalModels();
    const resultsCount = document.getElementById('resultsCount');
    const modelList = document.getElementById('modelList');
    const loadMoreSection = document.getElementById('loadMoreSection');

    if (resultsCount) resultsCount.textContent = `本地模型: ${models.length} 个`;

    if (models.length === 0) {
        modelList.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <p>暂无本地模型</p>
                <span>从搜索结果下载模型到本地</span>
            </div>
        `;
        if (loadMoreSection) loadMoreSection.style.display = 'none';
        return;
    }

    modelList.innerHTML = models.map(model => `
        <div class="model-item" data-id="${model.id}">
            <div class="model-avatar" style="background: ${getModelColor(model.name)}">${model.name.charAt(0)}</div>
            <div class="model-info">
                <div class="model-info-header">
                    <span class="model-info-name">${model.name}</span>
                    <span class="model-info-org">本地</span>
                </div>
                <p class="model-info-desc">已下载到本地的模型</p>
                <div class="model-meta-tags">
                    <span class="tag">${model.params || 'N/A'}</span>
                    <span class="tag">${model.path}</span>
                </div>
            </div>
            <div class="model-actions-mini">
                <button class="btn-primary btn-sm" onclick="deployFromSearch(${model.id})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    部署
                </button>
                <button class="btn-secondary btn-sm" onclick="deleteFromSearch(${model.id})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                    </svg>
                    删除
                </button>
            </div>
        </div>
    `).join('');

    if (loadMoreSection) loadMoreSection.style.display = 'none';
};

window.showFavorites = function() {
    const favorites = getFavoriteModels();
    const resultsCount = document.getElementById('resultsCount');
    const modelList = document.getElementById('modelList');
    const loadMoreSection = document.getElementById('loadMoreSection');

    if (resultsCount) resultsCount.textContent = `我的收藏: ${favorites.length} 个`;

    if (favorites.length === 0) {
        modelList.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <p>暂无收藏</p>
                <span>点击模型卡片上的收藏按钮添加</span>
            </div>
        `;
        if (loadMoreSection) loadMoreSection.style.display = 'none';
        return;
    }

    modelList.innerHTML = favorites.map(model => `
        <div class="model-item" data-id="${model.id}">
            <div class="model-avatar" style="background: ${getModelColor(model.name)}">${model.name.charAt(0)}</div>
            <div class="model-info">
                <div class="model-info-header">
                    <span class="model-info-name">${model.name}</span>
                    <span class="model-info-org">by ${model.org}</span>
                </div>
                <p class="model-info-desc">${model.desc}</p>
                <div class="model-meta-tags">
                    <span class="tag">${model.params}</span>
                    <span class="tag">${(model.downloads / 1000).toFixed(0)}k 下载</span>
                </div>
            </div>
            <div class="model-actions-mini">
                ${model.downloaded ?
                    `<button class="btn-primary btn-sm" onclick="deployFromSearch(${model.id})">部署</button>` :
                    `<button class="btn-primary btn-sm" onclick="downloadFromSearch(${model.id})">下载</button>`
                }
                <button class="btn-secondary btn-sm" onclick="removeFavFromSearch(${model.id}, this)">取消收藏</button>
            </div>
        </div>
    `).join('');

    if (loadMoreSection) loadMoreSection.style.display = 'none';
};

// All available models
function getAllModels() {
    const savedModels = DataManager.getSavedModels();
    const downloadedNames = savedModels.map(m => m.modelName);

    return [
        { id: 1, name: 'Qwen-7B-Chat', org: 'Qwen', params: '7B', task: 'text-generation', taskName: '文本生成', desc: '阿里巴巴推出的大规模语言模型，支持中英文对话，在多项基准测试中表现优异。', downloads: 125000, downloaded: downloadedNames.includes('Qwen-7B-Chat') },
        { id: 2, name: 'Yi-6B-Chat', org: '01-ai', params: '6B', task: 'text-generation', taskName: '文本生成', desc: '零一万物推出的中英文大语言模型，在语言理解和生成方面表现出色。', downloads: 89000, downloaded: downloadedNames.includes('Yi-6B-Chat') },
        { id: 3, name: 'ChatGLM3-6B', org: 'THUDM', params: '6B', task: 'text-generation', taskName: '对话模型', desc: '智谱AI推出的第三代ChatGLM模型，支持中英文对话，代码生成和推理能力增强。', downloads: 156000, downloaded: downloadedNames.includes('ChatGLM3-6B') },
        { id: 4, name: 'Baichuan2-7B-Chat', org: 'baichuan-inc', params: '7B', task: 'text-generation', taskName: '对话模型', desc: '百川智能推出的开源大语言模型，在中文理解方面表现突出。', downloads: 67000, downloaded: downloadedNames.includes('Baichuan2-7B-Chat') },
        { id: 5, name: 'DeepSeek-7B-Chat', org: 'deepseek-ai', params: '7B', task: 'text-generation', taskName: '对话模型', desc: '深度求索推出的高性能大语言模型，代码和数学推理能力强。', downloads: 45000, downloaded: downloadedNames.includes('DeepSeek-7B-Chat') },
        { id: 6, name: 'Mistral-7B-Instruct', org: 'mistralai', params: '7B', task: 'text-generation', taskName: '指令遵循', desc: 'Mistral AI推出的7B指令微调模型，性能超越多数同规模模型。', downloads: 234000, downloaded: downloadedNames.includes('Mistral-7B-Instruct') },
        { id: 7, name: 'Llama-2-7B-Chat', org: 'meta-llama', params: '7B', task: 'text-generation', taskName: '对话模型', desc: 'Meta推出的Llama 2对话微调模型，支持商用授权。', downloads: 312000, downloaded: downloadedNames.includes('Llama-2-7B-Chat') },
        { id: 8, name: 'CodeLlama-7B-Instruct', org: 'meta-llama', params: '7B', task: 'code-generation', taskName: '代码生成', desc: '专门针对代码任务微调的Llama模型，支持代码补全和解释。', downloads: 178000, downloaded: downloadedNames.includes('CodeLlama-7B-Instruct') },
        { id: 9, name: 'Qwen-14B-Chat', org: 'Qwen', params: '14B', task: 'text-generation', taskName: '文本生成', desc: '更大规模的Qwen模型，在复杂推理任务上表现更佳。', downloads: 78000, downloaded: downloadedNames.includes('Qwen-14B-Chat') },
        { id: 10, name: 'Yi-34B-Chat', org: '01-ai', params: '34B', task: 'text-generation', taskName: '对话模型', desc: 'Yi系列最大规模模型，在各项评测中接近GPT-3.5水平。', downloads: 34000, downloaded: downloadedNames.includes('Yi-34B-Chat') },
        { id: 11, name: 'Aquila-7B-Chat', org: 'BAAI', params: '7B', task: 'text-generation', taskName: '对话模型', desc: '智源研究院推出的开源大语言模型，中文能力突出。', downloads: 42000, downloaded: downloadedNames.includes('Aquila-7B-Chat') },
        { id: 12, name: 'InternLM-7B-Chat', org: 'Shanghai-AI', params: '7B', task: 'text-generation', taskName: '对话模型', desc: '上海人工智能实验室推出的对话语言模型。', downloads: 95000, downloaded: downloadedNames.includes('InternLM-7B-Chat') },
    ];
}

function getLocalModels() {
    const savedModels = DataManager.getSavedModels();
    return savedModels.map((m, index) => ({
        id: m.id || index + 1000,
        name: m.modelName || m.name,
        org: '本地',
        params: m.modelParams || m.params || 'N/A',
        desc: '本地模型',
        taskName: '本地',
        downloads: 0,
        path: m.modelPath || m.path || '',
        downloaded: true
    }));
}

function getFavoriteModels() {
    try {
        const favorites = JSON.parse(localStorage.getItem('quant_studio_favorites') || '[]');
        return getAllModels().filter(m => favorites.includes(m.id));
    } catch (e) {
        return [];
    }
}

function downloadFromSearch(modelId) {
    const model = getAllModels().find(m => m.id === modelId);
    if (!model) return;

    const btn = event.target.closest('.btn-primary');
    if (btn) {
        btn.innerHTML = '<span class="spinner-small"></span> 下载中...';
        btn.disabled = true;

        setTimeout(() => {
            DataManager.saveModel({
                modelId: model.id,
                modelName: model.name,
                modelParams: model.params,
                modelOrg: model.org,
                modelPath: '/models/' + model.name.toLowerCase().replace(/\s+/g, '-'),
                downloaded: true
            });

            btn.innerHTML = '已下载';
            btn.disabled = true;
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-secondary');
        }, 1500);
    }
}

function deployFromSearch(modelId) {
    const deployLink = document.querySelector('.nav-link[data-page="deploy"]');
    if (deployLink) {
        deployLink.click();
    }
}

function toggleFavFromSearch(modelId, btn) {
    try {
        let favorites = JSON.parse(localStorage.getItem('quant_studio_favorites') || '[]');
        const index = favorites.indexOf(modelId);

        if (index > -1) {
            favorites.splice(index, 1);
            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> 收藏`;
        } else {
            favorites.push(modelId);
            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> 已收藏`;
        }

        localStorage.setItem('quant_studio_favorites', JSON.stringify(favorites));
    } catch (e) {
        console.error('Toggle favorite failed:', e);
    }
}

function removeFavFromSearch(modelId, btn) {
    toggleFavFromSearch(modelId, btn);
    btn.closest('.model-item').remove();
}

function deleteFromSearch(modelId) {
    if (confirm('确定要删除此本地模型吗？')) {
        DataManager.deleteSavedModel(modelId);
        showLocalModels();
    }
}

// Export functions to window
window.downloadFromSearch = downloadFromSearch;
window.deployFromSearch = deployFromSearch;
window.toggleFavFromSearch = toggleFavFromSearch;
window.removeFavFromSearch = removeFavFromSearch;
window.deleteFromSearch = deleteFromSearch;
window.showLocalModels = showLocalModels;
window.showFavorites = showFavorites;

// ===== Deploy Page =====
function initDeployPage() {
    const deployTabs = document.querySelectorAll('.deploy-tab');
    const deployPanels = document.querySelectorAll('.deploy-panel');

    // Tab switching
    deployTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.deploy;

            deployTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            deployPanels.forEach(panel => {
                panel.classList.toggle('active', panel.id === `${target}-panel`);
            });
        });
    });

    // Populate model select
    populateDeployModelSelect();

    // Initialize copy buttons
    initCopyButtons();
}

function populateDeployModelSelect() {
    const select = document.getElementById('deployModelSelect');
    if (!select) return;

    const localModels = getLocalModels();
    const downloadedModels = getAllModels().filter(m => m.downloaded);

    select.innerHTML = '<option value="">请选择模型...</option>';

    if (localModels.length > 0) {
        select.innerHTML += '<optgroup label="本地模型">';
        localModels.forEach(m => {
            select.innerHTML += `<option value="${m.id}">${m.name} (${m.params})</option>`;
        });
        select.innerHTML += '</optgroup>';
    }

    if (downloadedModels.length > 0) {
        select.innerHTML += '<optgroup label="已下载">';
        downloadedModels.forEach(m => {
            select.innerHTML += `<option value="${m.id}">${m.name} (${m.params})</option>`;
        });
        select.innerHTML += '</optgroup>';
    }

    // Change event
    select.addEventListener('change', () => {
        updateDeployConfig();
    });
}

function updateDeployConfig() {
    const select = document.getElementById('deployModelSelect');
    const configContainer = document.getElementById('deployConfigOutput');
    if (!select || !configContainer) return;

    const modelId = select.value;
    if (!modelId) {
        configContainer.innerHTML = '<p class="text-muted">请先选择一个模型</p>';
        return;
    }

    const model = getLocalModels().find(m => m.id == modelId) ||
                 getAllModels().find(m => m.id == modelId);

    if (!model) return;

    // Generate config based on active tab
    const activeTab = document.querySelector('.deploy-tab.active')?.dataset.deploy || 'ollama';
    let config = '';

    switch (activeTab) {
        case 'ollama':
            config = generateOllamaConfig(model);
            break;
        case 'lmstudio':
            config = generateLMStudioConfig(model);
            break;
        case 'vllm':
            config = generateVLLMConfig(model);
            break;
        case 'api':
            config = generateAPIConfig(model);
            break;
    }

    configContainer.innerHTML = `<pre><code>${config}</code></pre>`;
}

function generateOllamaConfig(model) {
    return `## Ollama 部署配置

# 1. 创建 Modelfile
FROM ./${model.name.toLowerCase().replace(/\s+/g, '-')}-quantized.gguf

# 2. 设置参数
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER num_predict 2048

# 3. 运行模型
# ollama create ${model.name.replace(/\s+/g, '-').toLowerCase()} -f Modelfile
# ollama run ${model.name.replace(/\s+/g, '-').toLowerCase()}

# 4. API 调用示例
curl http://localhost:11434/api/generate \\
  -d '{
    "model": "${model.name.replace(/\s+/g, '-').toLowerCase()}",
    "prompt": "你好，请介绍一下自己",
    "stream": false
  }'`;
}

function generateLMStudioConfig(model) {
    return `## LM Studio 本地部署

# 1. 下载模型文件
# 从 ModelScope 或 HuggingFace 下载 ${model.name}

# 2. 启动 LM Studio
# - 打开 LM Studio 应用
# - 点击 "Load Model"
# - 选择量化后的模型文件 (.gguf)

# 3. API 调用 (OpenAI 兼容)
curl http://localhost:1234/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${model.name}",
    "messages": [
      {"role": "system", "content": "你是一个有帮助的AI助手"},
      {"role": "user", "content": "你好"}
    ],
    "temperature": 0.7,
    "max_tokens": 2048
  }'

# 4. Python SDK 使用
import openai

client = openai.OpenAI(base_url="http://localhost:1234/v1", api_key="lm-studio")

response = client.chat.completions.create(
    model="${model.name}",
    messages=[
        {"role": "user", "content": "你好，请介绍一下自己"}
    ]
)
print(response.choices[0].message.content)`;
}

function generateVLLMConfig(model) {
    return `## vLLM 高性能推理部署

# 1. 安装 vLLM
# pip install vllm

# 2. 启动服务
python -m vllm.entrypoints.openai.api_server \\
    --model /path/to/${model.name.replace(/\s+/g, '_')} \\
    --quantization awq \\
    --dtype half \\
    --port 8000 \\
    --tensor-parallel-size 1

# 3. API 调用
curl http://localhost:8000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "/path/to/${model.name.replace(/\s+/g, '_')}",
    "messages": [
      {"role": "system", "content": "你是一个有帮助的AI助手"},
      {"role": "user", "content": "你好"}
    ],
    "temperature": 0.7,
    "max_tokens": 2048,
    "guided_choice": ["Llama-2", "Qwen"]
  }'

# 4.批量推理
python -m vllm.entrypoints.openai.api_server \\
    --model /path/to/${model.name.replace(/\s+/g, '_')} \\
    --quantization awq \\
    --port 8000 \\
    --enforce-eager  # 减少显存占用`;
}

function generateAPIConfig(model) {
    return `## OpenAI 兼容 API 部署

# 1. 使用 FastAPI 部署量化模型

# 安装依赖
pip install fastapi uvicorn transformers accelerate

# 2. 创建 server.py
from fastapi import FastAPI
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

app = FastAPI()

# 加载量化模型
model_name = "${model.name}"
tokenizer = AutoTokenizer.from_pretrained(f"./models/{model_name}")
model = AutoModelForCausalLM.from_pretrained(
    f"./models/{model_name}",
    torch_dtype=torch.float16,
    device_map="auto"
)

@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    data = await request.json()
    messages = data.get("messages", [])
    prompt = tokenizer.apply_chat_template(messages, tokenize=False)
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

    outputs = model.generate(
        **inputs,
        max_new_tokens=data.get("max_tokens", 2048),
        temperature=data.get("temperature", 0.7),
        do_sample=True
    )

    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return {
        "choices": [{
            "message": {
                "content": response
            }
        }]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# 3. 运行服务
# python server.py

# 4. 调用 API
curl http://localhost:8000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      {"role": "user", "content": "你好"}
    ]
  }'`;
}

function initCopyButtons() {
    document.querySelectorAll('.deploy-code .copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const code = btn.parentElement.querySelector('code')?.textContent ||
                        btn.parentElement.querySelector('pre')?.textContent;
            if (code) {
                navigator.clipboard.writeText(code.trim()).then(() => {
                    const original = btn.innerHTML;
                    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
                    setTimeout(() => {
                        btn.innerHTML = original;
                    }, 1500);
                });
            }
        });
    });
}

// ===== Fisher Sensitivity Heatmap =====
const SUBLAYER_NAMES = ['Q proj', 'K proj', 'V proj', 'O proj', 'Up proj', 'Gate', 'Down proj'];
const SENSITIVITY_DATA = {
    'llama-7b': generateSensitivityData(32, 'llama'),
    'qwen-7b': generateSensitivityData(32, 'qwen')
};

function generateSensitivityData(numLayers, modelType) {
    const data = [];
    for (let l = 0; l < numLayers; l++) {
        const layerData = [];
        // First/last layers have higher sensitivity (matching Ch3 Fig.8 Fisher results)
        const positionFactor = (l < 4 || l >= numLayers - 4)
            ? 0.7 + Math.random() * 0.25
            : 0.15 + Math.random() * 0.25;

        // Sub-layer sensitivity patterns: Q/V > K/O > FFN
        const sublayerWeights = [1.0, 0.65, 0.95, 0.72, 0.55, 0.48, 0.42]; // Q,K,V,O,Up,Gate,Down

        for (let s = 0; s < 7; s++) {
            let sensitivity = positionFactor * sublayerWeights[s];
            // Add slight variation
            sensitivity += (Math.random() - 0.5) * 0.08;
            // Middle layers have sinusoidal variation for realism
            if (l >= 4 && l < numLayers - 4) {
                sensitivity += Math.sin(l * 0.5) * 0.06;
            }
            sensitivity = Math.max(0.05, Math.min(0.98, sensitivity));
            layerData.push(sensitivity);
        }
        data.push(layerData);
    }
    return data;
}

function sensitivityToColor(value) {
    // Green(low) -> Yellow(mid) -> Red(high) color mapping
    if (value < 0.3) {
        const t = value / 0.3;
        const r = Math.round(80 + t * 175);
        const g = Math.round(200 - t * 50);
        const b = Math.round(80 - t * 40);
        return `rgb(${r},${g},${b})`;
    } else if (value < 0.7) {
        const t = (value - 0.3) / 0.4;
        const r = Math.round(255);
        const g = Math.round(150 - t * 100);
        const b = Math.round(40 - t * 20);
        return `rgb(${r},${g},${b})`;
    } else {
        const t = (value - 0.7) / 0.3;
        const r = Math.round(255 - t * 40);
        const g = Math.round(50 - t * 30);
        const b = Math.round(20 + t * 10);
        return `rgb(${r},${g},${b})`;
    }
}

function initSensitivityHeatmap() {
    const container = document.getElementById('sensitivityHeatmap');
    if (!container) return;

    const modelSelect = document.getElementById('heatmapModel');
    const refreshBtn = document.getElementById('refreshHeatmap');

    renderSensitivityHeatmap('llama-7b');

    if (modelSelect) {
        modelSelect.addEventListener('change', (e) => {
            renderSensitivityHeatmap(e.target.value);
        });
    }
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            const model = modelSelect?.value || 'llama-7b';
            SENSITIVITY_DATA[model] = generateSensitivityData(32, model);
            renderSensitivityHeatmap(model);
        });
    }
}

function renderSensitivityHeatmap(modelKey) {
    const container = document.getElementById('sensitivityHeatmap');
    const infoPanel = document.getElementById('heatmapInfo');
    if (!container) return;

    const data = SENSITIVITY_DATA[modelKey] || SENSITIVITY_DATA['llama-7b'];
    const numLayers = data.length;
    const numSublayers = SUBLAYER_NAMES.length;

    const cellW = 18, cellH = 28;
    const padLeft = 70, padTop = 25, padRight = 20, padBottom = 30;
    const width = padLeft + numLayers * cellW + padRight;
    const height = padTop + numSublayers * cellH + padBottom;

    let svg = `<svg class="heatmap-svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">`;

    // Y-axis labels
    SUBLAYER_NAMES.forEach((name, i) => {
        const y = padTop + i * cellH + cellH / 2 + 4;
        svg += `<text x="${padLeft - 6}" y="${y}" text-anchor="end" font-size="11" fill="#6B7280">${name}</text>`;
    });

    // Heatmap cells
    for (let l = 0; l < numLayers; l++) {
        for (let s = 0; s < numSublayers; s++) {
            const val = data[l][s];
            const x = padLeft + l * cellW;
            const y = padTop + s * cellH;
            const color = sensitivityToColor(val);
            const bitSuggestion = val > 0.7 ? '8-bit' : val > 0.4 ? '4-bit' : '3-bit';

            svg += `<rect x="${x}" y="${y}" width="${cellW - 1}" height="${cellH - 1}" rx="2"
                          fill="${color}" opacity="0.85" class="heatmap-cell"
                          data-layer="${l}" data-sublayer="${SUBLAYER_NAMES[s]}"
                          data-sensitivity="${val.toFixed(3)}" data-bit="${bitSuggestion}"/>`;
        }
    }

    // X-axis labels (every 4 layers)
    for (let l = 0; l < numLayers; l += 4) {
        const x = padLeft + l * cellW + cellW / 2;
        svg += `<text x="${x}" y="${height - 8}" text-anchor="middle" font-size="10" fill="#9CA3AF">${l}</text>`;
    }
    svg += `<text x="${padLeft + numLayers * cellW / 2}" y="${height}" text-anchor="middle" font-size="11" fill="#6B7280">层索引</text>`;

    svg += '</svg>';
    container.innerHTML = svg;

    // Hover interaction
    container.querySelectorAll('.heatmap-cell').forEach(cell => {
        cell.addEventListener('mouseenter', (e) => {
            const layer = e.target.dataset.layer;
            const sublayer = e.target.dataset.sublayer;
            const sens = e.target.dataset.sensitivity;
            const bit = e.target.dataset.bit;
            if (infoPanel) {
                infoPanel.innerHTML = `<span>第 <strong>${layer}</strong> 层 · <strong>${sublayer}</strong> · 敏感度: <strong>${sens}</strong> · 建议位宽: <strong>${bit}</strong></span>`;
            }
            e.target.setAttribute('stroke', '#111827');
            e.target.setAttribute('stroke-width', '2');
        });
        cell.addEventListener('mouseleave', (e) => {
            if (infoPanel) {
                infoPanel.innerHTML = '<span>悬停查看各层详细敏感度信息</span>';
            }
            e.target.removeAttribute('stroke');
            e.target.removeAttribute('stroke-width');
        });
    });
}
