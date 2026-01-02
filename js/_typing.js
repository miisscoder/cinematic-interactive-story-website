 
/**
 * 打字机效果函数（带强制中断和内存清理）
 * @param {string|HTMLElement} selector - CSS选择器或DOM元素
 * @param {string} text - 要显示的文字
 * @param {object} options - 配置选项
 */
function typeWriter(selector, text, options = {}) {
    const config = {
        speed: 200,
        delay: 0,
        cursor: false,
        cursorChar: '|',
        onComplete: null,
        // 中断模式：'stop'=停止并清空，'abort'=停止但保留，'override'=强行覆盖
        interruptMode: 'stop',
        // 强制中断：是否清理所有历史任务残留
        forceCleanup: false,
        // 分割字符：''表示按字符，' '表示按单词，','表示按逗号分割等
        splitChar: '',
        ...options
    };
    
    const element = typeof selector === 'string' 
        ? document.querySelector(selector) 
        : selector;
    
    if (!element) {
        console.error('元素未找到:', selector);
        return { stop: () => {}, clear: () => {}, destroy: () => {} };
    }
    
    // 强制清理所有历史残留
    if (config.forceCleanup) {
        typeWriter.destroy(element);
    }
    
    // 生成唯一ID用于标识当前任务
    const taskId = Date.now() + Math.random().toString(36).substr(2, 9);
    
    // 如果有正在运行的任务，根据中断模式处理
    if (element._typewriterTaskId) {
        switch(config.interruptMode) {
            case 'stop':
                typeWriter.stop(element);
                typeWriter.clear(element);
                break;
            case 'abort':
                typeWriter.stop(element);
                break;
            case 'override':
                // 直接覆盖
                typeWriter.stop(element);
                element.textContent = '';
                break;
            default:
                console.warn('已有打字动画正在运行，忽略新请求');
                return { 
                    stop: () => {}, 
                    clear: () => {}, 
                    destroy: () => {},
                    taskId: null 
                };
        }
    }
    
    // 根据splitChar分割文本
    let chunks = [];
    if (config.splitChar === ' ') {
        // 按单词分割，保留空格
        chunks = text.split(/(\s+)/);
        // 过滤空字符串
        chunks = chunks.filter(chunk => chunk.length > 0);
    } else if (config.splitChar === ',') {
        // 按逗号分割，保留逗号
        chunks = text.split(/(,)/);
        chunks = chunks.filter(chunk => chunk.length > 0);
    } else if (config.splitChar) {
        // 按指定字符分割
        chunks = text.split(config.splitChar);
        // 将分隔符加回去
        if (config.splitChar.length === 1) {
            const result = [];
            for (let i = 0; i < chunks.length; i++) {
                result.push(chunks[i]);
                if (i < chunks.length - 1) {
                    result.push(config.splitChar);
                }
            }
            chunks = result;
        }
        chunks = chunks.filter(chunk => chunk.length > 0);
    } else {
        // 默认按字符分割
        chunks = text.split('');
    }
    
    // 存储任务信息
    element._typewriterTaskId = taskId;
    element._typewriterChunks = chunks;
    element._typewriterIndex = 0;
    element._typewriterConfig = config;
    
    // 清空元素内容
    if (config.interruptMode !== 'abort') {
        element.textContent = '';
    }
    
    // 延迟开始
    const delayTimer = setTimeout(() => {
        // 检查任务是否已被中止
        if (element._typewriterTaskId !== taskId) return;
        
        if (config.cursor) {
            const cursorSpan = document.createElement('span');
            cursorSpan.className = 'typewriter-cursor';
            cursorSpan.textContent = config.cursorChar;
            element.appendChild(cursorSpan);
        }
        
        // 开始打字
        typeNextChunk();
        
    }, config.delay);
    
    // 存储定时器以便中止
    element._typewriterDelayTimer = delayTimer;
    
    // 内部函数：打出下一个块（字符或单词）
    function typeNextChunk() {
        // 检查任务是否已被中止
        if (element._typewriterTaskId !== taskId) return;
        
        if (element._typewriterIndex < element._typewriterChunks.length) {
            // 移除光标（如果有）
            if (config.cursor) {
                const cursor = element.querySelector('.typewriter-cursor');
                if (cursor) cursor.remove();
            }
            
            // 添加当前块
            element.textContent += element._typewriterChunks[element._typewriterIndex];
            element._typewriterIndex++;
            
            // 重新添加光标（如果有）
            if (config.cursor) {
                const cursorSpan = document.createElement('span');
                cursorSpan.className = 'typewriter-cursor';
                cursorSpan.textContent = config.cursorChar;
                element.appendChild(cursorSpan);
            }
            
            // 设置下一次打字
            element._typewriterTimer = setTimeout(typeNextChunk, config.speed);
        } else {
            // 完成
            finishTask();
        }
    }
    
    // 完成任务的清理工作
    function finishTask() {
        if (element._typewriterTaskId !== taskId) return;
        
        cleanupTask(taskId);
        
        // 执行完成回调
        if (config.onComplete && typeof config.onComplete === 'function') {
            config.onComplete();
        }
    }
    
    // 清理指定任务
    function cleanupTask(id) {
        if (element._typewriterTaskId !== id) return;
        
        // 清理所有定时器
        if (element._typewriterDelayTimer) {
            clearTimeout(element._typewriterDelayTimer);
        }
        if (element._typewriterTimer) {
            clearTimeout(element._typewriterTimer);
        }
        
        // 移除光标
        if (config.cursor) {
            const cursor = element.querySelector('.typewriter-cursor');
            if (cursor) cursor.remove();
        }
        
        // 清理内存 - 删除所有相关属性
        const props = [
            '_typewriterTaskId',
            '_typewriterChunks',
            '_typewriterIndex',
            '_typewriterTimer',
            '_typewriterDelayTimer',
            '_typewriterConfig'
        ];
        
        props.forEach(prop => {
            if (element[prop] !== undefined) {
                delete element[prop];
            }
        });
    }
    
    // 返回控制对象
    const control = {
        // 停止当前打字任务
        stop: () => {
            cleanupTask(taskId);
        },
        
        // 停止并清空内容
        clear: () => {
            cleanupTask(taskId);
            element.textContent = '';
        },
        
        // 强制销毁 - 清理所有残留
        destroy: () => {
            cleanupTask(taskId);
            typeWriter.destroy(element);
        },
        
        // 获取任务ID
        taskId: taskId,
        
        // 检查是否仍在运行
        isRunning: () => {
            return element._typewriterTaskId === taskId;
        },
        
        // 获取当前进度
        getProgress: () => {
            return {
                current: element._typewriterIndex,
                total: element._typewriterChunks ? element._typewriterChunks.length : 0,
                percentage: element._typewriterChunks ? (element._typewriterIndex / element._typewriterChunks.length * 100) : 0
            };
        },
        
        // 跳转到指定位置
        jumpTo: (position) => {
            if (!element._typewriterChunks || position < 0 || position > element._typewriterChunks.length) {
                return false;
            }
            
            // 停止当前计时器
            if (element._typewriterTimer) {
                clearTimeout(element._typewriterTimer);
            }
            
            // 更新索引
            element._typewriterIndex = position;
            
            // 更新显示内容
            element.textContent = element._typewriterChunks.slice(0, position).join('');
            
            // 重新开始
            typeNextChunk();
            
            return true;
        },
        
        // 获取配置
        getConfig: () => {
            return { ...config };
        }
    };
    
    return control;
}

// 静态方法：停止指定元素的所有打字任务
typeWriter.stop = function(selector) {
    const element = typeof selector === 'string' 
        ? document.querySelector(selector) 
        : selector;
    
    if (element && element._typewriterTaskId) {
        // 清理定时器
        if (element._typewriterDelayTimer) {
            clearTimeout(element._typewriterDelayTimer);
        }
        if (element._typewriterTimer) {
            clearTimeout(element._typewriterTimer);
        }
        
        // 移除光标
        const cursor = element.querySelector('.typewriter-cursor');
        if (cursor) cursor.remove();
        
        // 不清理内容，仅停止
    }
};

// 静态方法：停止并清空指定元素
typeWriter.clear = function(selector) {
    const element = typeof selector === 'string' 
        ? document.querySelector(selector) 
        : selector;
    
    typeWriter.stop(element);
    if (element) {
        element.textContent = '';
    }
};

// 静态方法：强制销毁 - 清理所有内存残留
typeWriter.destroy = function(selector) {
    const element = typeof selector === 'string' 
        ? document.querySelector(selector) 
        : selector;
    
    if (!element) return;
    
    // 清理所有定时器
    const timers = ['_typewriterDelayTimer', '_typewriterTimer'];
    timers.forEach(timerProp => {
        if (element[timerProp]) {
            clearTimeout(element[timerProp]);
            element[timerProp] = null;
        }
    });
    
    // 移除光标
    const cursor = element.querySelector('.typewriter-cursor');
    if (cursor) cursor.remove();
    
    // 清理所有相关属性（彻底释放内存）
    const cleanupProps = [
        '_typewriterTaskId',
        '_typewriterChunks',
        '_typewriterIndex',
        '_typewriterConfig',
        '_typewriterDelayTimer',
        '_typewriterTimer'
    ];
    
    cleanupProps.forEach(prop => {
        if (element[prop] !== undefined) {
            delete element[prop];
        }
    });
    
    // 强制垃圾回收提示（仅开发环境）
    if (typeof window.gc === 'function') {
        window.gc();
    }
};

// 静态方法：检查元素是否有打字动画正在运行
typeWriter.isRunning = function(selector) {
    const element = typeof selector === 'string' 
        ? document.querySelector(selector) 
        : selector;
    
    return element && 
           element._typewriterTaskId !== undefined && 
           element._typewriterTimer !== undefined;
};

// 静态方法：获取元素的所有打字任务信息（调试用）
typeWriter.getTaskInfo = function(selector) {
    const element = typeof selector === 'string' 
        ? document.querySelector(selector) 
        : selector;
    
    if (!element) return null;
    
    return {
        taskId: element._typewriterTaskId,
        chunks: element._typewriterChunks,
        index: element._typewriterIndex,
        total: element._typewriterChunks ? element._typewriterChunks.length : 0,
        delayTimer: element._typewriterDelayTimer,
        timer: element._typewriterTimer,
        config: element._typewriterConfig
    };
};

// 静态方法：批量停止多个元素
typeWriter.stopAll = function(selectors) {
    if (Array.isArray(selectors)) {
        selectors.forEach(selector => typeWriter.stop(selector));
    } else if (typeof selectors === 'string') {
        document.querySelectorAll(selectors).forEach(el => typeWriter.stop(el));
    }
};

// 静态方法：批量清空多个元素
typeWriter.clearAll = function(selectors) {
    if (Array.isArray(selectors)) {
        selectors.forEach(selector => typeWriter.clear(selector));
    } else if (typeof selectors === 'string') {
        document.querySelectorAll(selectors).forEach(el => typeWriter.clear(el));
    }
};

// 静态方法：批量销毁多个元素
typeWriter.destroyAll = function(selectors) {
    if (Array.isArray(selectors)) {
        selectors.forEach(selector => typeWriter.destroy(selector));
    } else if (typeof selectors === 'string') {
        document.querySelectorAll(selectors).forEach(el => typeWriter.destroy(el));
    }
};

// 添加光标闪烁样式
(function() {
    // 只在需要时添加样式
    if (!document.querySelector('#typewriter-styles')) {
        const style = document.createElement('style');
        style.id = 'typewriter-styles';
        style.textContent = `
            .typewriter-cursor {
                animation: typewriter-cursor-blink 1s infinite;
                color: #00dbde;
                font-weight: bold;
            }
            @keyframes typewriter-cursor-blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
})();

// 导出到全局
if (typeof module !== 'undefined' && module.exports) {
    module.exports = typeWriter;
} else if (typeof define === 'function' && define.amd) {
    define('typeWriter', [], function() {
        return typeWriter;
    });
} else {
    window.typeWriter = typeWriter;
} 