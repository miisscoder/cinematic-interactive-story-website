
/**
 * 多容器轮播内容管理器
 * @param {object} containers - 容器映射 {key: elementId, ...}
 * @param {object} contentMap - 内容映射表
 */
function MultiContainerManager(containers, contentMap) {
    const manager = {
        containers: {},
        contentMap: contentMap,
        currentTask: null,
        isPlaying: false,
        activeContainer: null,
        sequence: [],
        currentContainerIndex: 0,
        currentItemIndex: 0,
        swiper: null,
        fullpage: null,

        /**
         * 初始化管理器
         */
        init: function () {
            // 初始化容器引用
            for (const [key, id] of Object.entries(containers)) {
                const element = document.getElementById(id);
                if (element) {
                    this.containers[key] = {
                        element: element,
                        slideElement: element.closest('.swiper-slide')
                    };
                } else {
                    console.error(`容器 ${id} 未找到`);
                }
            }

            // 默认序列：chapter1 → chapter2 → chapter3
            this.sequence = Object.keys(containers);
            this.activeContainer = this.sequence[0];
            console.log('init activeContainer: ' + this.activeContainer);


            console.log('初始化manager');
            return this;
        },

        /**
         * 设置Swiper实例
         */
        setSwiper: function (swiper) {
            this.swiper = swiper;
            console.log('初始化manager的swiper：' + swiper);
        },

        /**
         * 设置fullPage实例
         */
        setFullpage: function (fullpage) {
            this.fullpage = fullpage;
            console.log('初始化manager的fullpage：' + fullpage);
        },

        /**
         * 开始播放序列
         */
        startSequence: function () {
            if (this.isPlaying) {
                this.stopAll();
            }

            this.currentContainerIndex = 0;
            this.currentItemIndex = 0;
            // 确保 activeContainer 有值
            if (!this.activeContainer) {
                this.activeContainer = this.sequence[0];
            }

            // 清空所有容器
            this.clearAllContainers();
            console.log('startSequence 清空所有容器 clearAllContainers');
            this.isPlaying = true;

            // 开始播放
            console.log('play is true now : 开始播放');
            this.playNextContainer();

            return this.getControlHandle();
        },

        /**
         * 播放下一个容器
         */
        playNextContainer: function () {
            try {
                console.log(this.isPlaying);
                console.log(this.currentContainerIndex >= this.sequence.length);
                if (!this.isPlaying || this.currentContainerIndex >= this.sequence.length) {
                    this.endSequence();
                    return;
                }

                const containerKey = this.sequence[this.currentContainerIndex];
                const container = this.containers[containerKey];

                console.log(container);
                if (!container) {
                    this.currentContainerIndex++;
                    this.playNextContainer();
                    return;
                }

                this.activeContainer = containerKey;
                this.currentItemIndex = 0;

                // 切换到对应的swiper幻灯片
                console.log(this.swiper);
                if (this.swiper) {
                    this.swiper.slideTo(this.currentContainerIndex, 0);
                }

                // 等待slide切换完成
                setTimeout(() => {
                    this.showCurrentItem();
                }, 100);
            } catch (error) { console.log('error+' + error); }
        },

        /**
         * 显示当前项目
         */
        showCurrentItem: function () {
            const containerKey = this.activeContainer;
            const container = this.containers[containerKey];

            if (!container || !this.isPlaying) return;

            const items = this.contentMap[containerKey];
            if (!items || this.currentItemIndex >= items.length) {
                // 当前容器已播放完，切换到下一个容器
                this.currentContainerIndex++;
                this.playNextContainer();
                return;
            }

            const item = items[this.currentItemIndex];

            // 检查是否是第三章最后一页
            const isLastPage = (containerKey === 'chapter3' && this.currentItemIndex === items.length - 1);

            // 显示项目
            this.showItem(containerKey, this.currentItemIndex, item, isLastPage);
        },

        /**
         * 在指定容器显示项目
         */
        showItem: function (containerKey, itemIndex, item, isLastPage = false) {
            console.log('showItem called:', containerKey, itemIndex);

            const container = this.containers[containerKey];
            if (!container || !container.element) {
                console.error('Container not found:', containerKey);
                return;
            }

            // 停止之前的任务
            if (this.currentTask) {
                this.currentTask.stop();
            }

            // 清空容器
            container.element.innerHTML = '';


            // 确保slide有active类
            if (container.slideElement) {
                container.slideElement.classList.add('active');
            }

            // 创建图片元素
            if (item.bk && item.bk !== 'none') {
                const img = document.createElement('img');
                img.className = 'bk-image';
                img.src = `image/${item.bk}`;
                container.element.appendChild(img);
            }


            // 创建cover元素（注意：现在cover默认透明）
            const cover = document.createElement('div');
            cover.className = 'cover';

            // 第一章第一页特殊处理
            if (containerKey === 'chapter1' && itemIndex === 0) {
                // 第一章第一页不需要cover遮罩，保持透明
                cover.style.opacity = '0';
            } else {
                // 其他页面需要半透明遮罩
                cover.style.opacity = '1';
            }

            // 图片淡入
            setTimeout(() => {
                cover.style.opacity = '.5';
            }, 50);

            container.element.appendChild(cover);

            // 创建文字元素
            if (item.text && item.text.trim()) {
                const textContainer = document.createElement('div');
                textContainer.className = 'text';
                textContainer.style.cssText = `
            width: ${item.width}px; 
            left: ${(window.innerWidth - item.width) / 2}px;
            opacity: 0;
        `;
                container.element.appendChild(textContainer);

                // 延迟显示文字
                setTimeout(() => {
                    textContainer.style.opacity = '1';

                    // 使用typing.js进行单词级打字效果
                    const typewriterTask = typeWriter(textContainer, item.text, {
                        speed: 200,
                        cursor: false,
                        interruptMode: 'override',
                        forceCleanup: true,
                        splitChar: ' ', // 按单词分割
                        // ========== 开始修改：启用音效 ==========
                        sound: true,
                        soundFile: './music/long-sound-typewriter.mp3',
                        soundVolume: 0.3,
                        // ========== 结束修改 ==========
                        onComplete: () => {
                            // 文字输入完成
                            setTimeout(() => {
                                if (this.isPlaying) {
                                    // 如果是最后一页，直接跳转到footer
                                    if (isLastPage) {
                                        this.gotoFooter();
                                    } else {
                                        this.currentItemIndex++;
                                        this.showCurrentItem();
                                    }
                                }
                            }, 1000);
                        }
                    });

                    this.currentTask = typewriterTask;

                }, 500); // 等待元素添加完成
            }
        },

        /**
         * 跳转到footer
         */
        gotoFooter: function () {
            this.stopAll();

            // 清空所有容器
            this.clearAllContainers();

            // === 3. 归：重置Swiper，然后滚动Fullpage ===
            // 先确保Swiper实例存在
            if (this.swiper) {
                console.log('正在重置Swiper到第一章...');
                // 滑到第一张幻灯片 (索引0)，速度为0表示无动画瞬切
                this.swiper.slideTo(0, 0);
                // 重要：同时更新管理器内部状态，保持与Swiper视图一致
                this.activeContainer = this.sequence[0]; // 'chapter1'
                this.currentContainerIndex = 0;
                this.currentItemIndex = 0;
            } else {
                console.warn('跳转到Footer时，Swiper实例不存在');
            }

            // 滚动到footer
            if (this.fullpage) {
                console.log('滚动到footer');
                this.fullpage.moveTo(3);
            }
        },

        /**
         * 结束序列
         */
        endSequence: function () {
            this.isPlaying = false;
            this.activeContainer = this.sequence[0];
            console.log('endSequence');
        },

        /**
         * 停止所有播放
         */
        stopAll: function () {
            this.isPlaying = false;

            if (this.currentTask) {
                this.currentTask.stop();
                this.currentTask = null;
            }

            this.activeContainer = this.sequence[0];
            console.log('stopAll');
        },

        /**
         * 清空所有容器
         */
        clearAllContainers: function () {
            this.stopAll();

            for (const [key, container] of Object.entries(this.containers)) {
                if (container.element) {
                    container.element.innerHTML = '';
                }

                if (container.slideElement) {
                    container.slideElement.classList.remove('active');
                }
            }
        },

        /**
         * 获取控制句柄
         */
        getControlHandle: function () {
            const self = this;

            return {
                togglePlay: function () {
                    if (self.isPlaying) {
                        console.log('pause : stop');
                        // 修改这里：真正的暂停
                        if (self.currentTask) {
                            self.currentTask.stop(); // 只停止当前打字任务
                        }
                        self.isPlaying = false; // 只设置状态为暂停
                        return false;
                    } else {
                        console.log('play : showCurrentItem');
                        self.isPlaying = true;
                        self.showCurrentItem(); // 从当前位置继续
                        return true;
                    }
                },
                stop: () => this.stopAll(),
                clear: () => this.clearAllContainers()
            };
        },
        /**
         * 修改章节切换逻辑
         */
        showCurrentItem: function () {
            console.log('this.activeContainer: ' + this.activeContainer);
            const containerKey = this.activeContainer ? this.activeContainer : this.sequence[0];
            const container = this.containers[containerKey];
            if (!container || !this.isPlaying) return;

            const items = this.contentMap[containerKey];
            if (!items || this.currentItemIndex >= items.length) {
                console.log('章节播放完成:', containerKey);

                // 问题4: 章节完成后应该清空内容
                if (container.element) {
                    container.element.innerHTML = '';
                }
                if (container.slideElement) {
                    container.slideElement.classList.remove('active');
                }

                // 切换到下一个容器
                this.currentContainerIndex++;

                // 延迟切换，确保动画完成
                setTimeout(() => {
                    this.playNextContainer();
                }, 500);

                return;
            }

            const item = items[this.currentItemIndex];

            // 检查是否是第三章最后一页
            const isLastPage = (containerKey === 'chapter3' && this.currentItemIndex === items.length - 1);

            // 显示项目
            this.showItem(containerKey, this.currentItemIndex, item, isLastPage);
        },
        /**
         * 修改播放下一个容器函数
         */
        playNextContainer: function () {
            try {
                console.log('播放状态:', this.isPlaying);
                console.log('当前章节索引:', this.currentContainerIndex);
                console.log('总章节数:', this.sequence.length);

                if (!this.isPlaying || this.currentContainerIndex >= this.sequence.length) {
                    this.endSequence();
                    return;
                }

                const containerKey = this.sequence[this.currentContainerIndex];
                const container = this.containers[containerKey];

                console.log('目标容器:', containerKey, container);

                if (!container) {
                    this.currentContainerIndex++;
                    this.playNextContainer();
                    return;
                }

                // 问题5: 确保清空上一个章节
                if (this.currentContainerIndex > 0) {
                    const prevKey = this.sequence[this.currentContainerIndex - 1];
                    const prevContainer = this.containers[prevKey];
                    if (prevContainer && prevContainer.element) {
                        prevContainer.element.innerHTML = '';
                    }
                }

                this.activeContainer = containerKey;
                this.currentItemIndex = 0;

                // 切换到对应的swiper幻灯片
                console.log('Swiper实例:', this.swiper);
                if (this.swiper) {
                    this.swiper.slideTo(this.currentContainerIndex, 800); // 添加切换动画
                }

                // 等待slide切换完成
                setTimeout(() => {
                    console.log('开始显示当前章节内容');
                    this.showCurrentItem();
                }, 1000); // 等待swiper切换动画
            } catch (error) {
                console.log('错误:', error);
            }
        }
    };

    return manager.init();
} 