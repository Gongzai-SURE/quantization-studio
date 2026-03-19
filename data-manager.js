/**
 * 本地数据管理模块
 * 用于保存用户登录信息、量化历史记录等配置
 */

const DataManager = {
    // 配置键名
    STORAGE_KEYS: {
        USER: 'quant_studio_user',
        HISTORY: 'quant_studio_history',
        SETTINGS: 'quant_studio_settings',
        SAVED_MODELS: 'quant_studio_saved_models'
    },

    /**
     * 获取用户信息
     */
    getUser() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.USER);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('读取用户信息失败:', e);
            return null;
        }
    },

    /**
     * 保存用户信息
     * @param {Object} userData - 用户数据对象
     */
    saveUser(userData) {
        try {
            const data = {
                ...userData,
                loginTime: new Date().toISOString()
            };
            localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存用户信息失败:', e);
            return false;
        }
    },

    /**
     * 用户登出
     */
    logout() {
        localStorage.removeItem(this.STORAGE_KEYS.USER);
    },

    /**
     * 获取所有量化历史记录
     */
    getHistory() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.HISTORY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('读取历史记录失败:', e);
            return [];
        }
    },

    /**
     * 添加量化历史记录
     * @param {Object} record - 历史记录对象
     */
    addHistory(record) {
        try {
            const history = this.getHistory();
            const newRecord = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                ...record
            };
            history.unshift(newRecord);

            // 最多保留100条记录
            if (history.length > 100) {
                history.pop();
            }

            localStorage.setItem(this.STORAGE_KEYS.HISTORY, JSON.stringify(history));
            return newRecord.id;
        } catch (e) {
            console.error('保存历史记录失败:', e);
            return null;
        }
    },

    /**
     * 删除历史记录
     * @param {number} id - 记录ID
     */
    deleteHistory(id) {
        try {
            const history = this.getHistory().filter(item => item.id !== id);
            localStorage.setItem(this.STORAGE_KEYS.HISTORY, JSON.stringify(history));
            return true;
        } catch (e) {
            console.error('删除历史记录失败:', e);
            return false;
        }
    },

    /**
     * 清空所有历史记录
     */
    clearHistory() {
        localStorage.removeItem(this.STORAGE_KEYS.HISTORY);
    },

    /**
     * 获取保存的模型列表
     */
    getSavedModels() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.SAVED_MODELS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('读取保存模型失败:', e);
            return [];
        }
    },

    /**
     * 保存量化后的模型
     * @param {Object} modelData - 模型数据
     */
    saveModel(modelData) {
        try {
            const models = this.getSavedModels();

            // 检查是否已存在
            const existingIndex = models.findIndex(m => m.modelId === modelData.modelId);

            if (existingIndex >= 0) {
                models[existingIndex] = { ...models[existingIndex], ...modelData, updatedAt: new Date().toISOString() };
            } else {
                models.push({
                    id: Date.now(),
                    createdAt: new Date().toISOString(),
                    ...modelData
                });
            }

            localStorage.setItem(this.STORAGE_KEYS.SAVED_MODELS, JSON.stringify(models));
            return true;
        } catch (e) {
            console.error('保存模型失败:', e);
            return false;
        }
    },

    /**
     * 删除保存的模型
     * @param {number} id - 模型ID
     */
    deleteSavedModel(id) {
        try {
            const models = this.getSavedModels().filter(m => m.id !== id);
            localStorage.setItem(this.STORAGE_KEYS.SAVED_MODELS, JSON.stringify(models));
            return true;
        } catch (e) {
            console.error('删除模型失败:', e);
            return false;
        }
    },

    /**
     * 获取应用设置
     */
    getSettings() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
            return data ? JSON.parse(data) : this.getDefaultSettings();
        } catch (e) {
            console.error('读取设置失败:', e);
            return this.getDefaultSettings();
        }
    },

    /**
     * 获取默认设置
     */
    getDefaultSettings() {
        return {
            theme: 'light',
            defaultBitWidth: 4,
            autoSave: true,
            showAdvancedOptions: false,
            language: 'zh-CN',
            recentModels: []
        };
    },

    /**
     * 保存应用设置
     * @param {Object} settings - 设置对象
     */
    saveSettings(settings) {
        try {
            const current = this.getSettings();
            const merged = { ...current, ...settings };
            localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
            return true;
        } catch (e) {
            console.error('保存设置失败:', e);
            return false;
        }
    },

    /**
     * 添加最近使用的模型
     * @param {Object} model - 模型对象
     */
    addRecentModel(model) {
        try {
            const settings = this.getSettings();
            const recentModels = settings.recentModels || [];

            // 移除已存在的同名模型
            const filtered = recentModels.filter(m => m.id !== model.id);

            // 添加到最前面
            filtered.unshift({
                id: model.id,
                name: model.name,
                org: model.org,
                usedAt: new Date().toISOString()
            });

            // 最多保留10个
            if (filtered.length > 10) {
                filtered.pop();
            }

            this.saveSettings({ recentModels: filtered });
        } catch (e) {
            console.error('保存最近模型失败:', e);
        }
    },

    /**
     * 导出所有数据（用于备份）
     */
    exportAllData() {
        const data = {
            exportTime: new Date().toISOString(),
            user: this.getUser(),
            history: this.getHistory(),
            settings: this.getSettings(),
            savedModels: this.getSavedModels()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quant-studio-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    /**
     * 导入数据（从备份恢复）
     * @param {string} jsonString - JSON字符串
     */
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            if (data.user) {
                localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(data.user));
            }
            if (data.history) {
                localStorage.setItem(this.STORAGE_KEYS.HISTORY, JSON.stringify(data.history));
            }
            if (data.settings) {
                localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
            }
            if (data.savedModels) {
                localStorage.setItem(this.STORAGE_KEYS.SAVED_MODELS, JSON.stringify(data.savedModels));
            }

            return true;
        } catch (e) {
            console.error('导入数据失败:', e);
            return false;
        }
    },

    /**
     * 清空所有数据
     */
    clearAllData() {
        Object.values(this.STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }
};

// 导出到全局
window.DataManager = DataManager;
