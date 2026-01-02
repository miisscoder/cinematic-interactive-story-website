// 监听mousedown事件
document.addEventListener('mousedown', () => {
    console.log('mousedown触发！');

    const audio = new Audio('./music/long-sound-typewriter.mp3');
    audio.volume = 0.01;
    audio.play().then(() => {
        console.log('滚动触发播放成功！');
        audio.pause();
        window.audioReady = true;
    }).catch(e => {
        console.log('滚动触发播放失败:', e.message);
    });
});
// ========== 结束修改 ==========
const contentMap = {
    'chapter1': [
        {
            id: 1,
            bk: 'home-2-1-1x.jpg',
            width: 760,
            text: 'Navigating the world\'s most complex markets is the ultimate test of global strategy.'
        },
        {
            id: 2,
            bk: 'home-2-2-1x.jpg',
            width: 600,
            text: 'It\'s a landscape defined by immense scale, untapped potential,'
        },
        {
            id: 3,
            bk: 'home-2-3-1x.jpg',
            width: 280,
            text: 'and intricate complexity.'
        },
        {
            id: 4,
            bk: 'home-2-4-1x.jpg',
            width: 250,
            text: 'Many venture into the fray.'
        },
        {
            id: 5,
            bk: 'home-2-5-1x.jpg',
            width: 260,
            text: 'Few possess the grit to last.'
        },
        {
            id: 6,
            bk: 'none',
            width: 354,
            text: 'True mastery belongs to a select few.'
        }
    ],
    'chapter2': [
        {
            id: 1,
            bk: 'home-3-1-1x.jpg',
            width: 500,
            text: 'We start by mastering a market\'s visible mechanics.'
        },
        {
            id: 2,
            bk: 'home-3-2-1x.jpg',
            width: 450,
            text: 'We dig deeper to uncover its underlying drivers.'
        },
        {
            id: 3,
            bk: 'home-3-3-1x.jpg',
            width: 650,
            text: 'This deep insight, fused with global strategic rigor, powers success.'
        },
        {
            id: 4,
            bk: 'home-3-4-1x.jpg',
            width: 550,
            text: 'The world\'s most demanding arenas are our proving ground.'
        }
    ],
    'chapter3': [
        {
            id: 1,
            bk: 'home-4-1-1x.jpg',
            width: 650,
            text: 'We partner with leading organizations: federations, leagues, and clubs.'
        },
        {
            id: 2,
            bk: 'home-4-2-1x.jpg',
            width: 670,
            text: 'To achieve what few can: sustained, triple-digit growth in new frontiers.'
        }
    ]
};

// 容器映射
const containers = {
    'chapter1': 'chapter-1',
    'chapter2': 'chapter-2',
    'chapter3': 'chapter-3'
};

// 初始化管理器
let manager = null;
let swiper2 = null;
let controlHandle = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM Content Loaded');

    // 1. 先初始化管理器
    manager = MultiContainerManager(containers, contentMap);
    window.manager = manager;

    // 2. 初始化Swiper
    initSwiper();

    // 4. 初始化播放按钮
    initPlayPauseButton();
});

// 初始化Swiper函数
function initSwiper() {
    console.log('Initializing Swiper...');

    swiper2 = new Swiper("#swiper-container-2", {
        slidesPerView: 1,
        spaceBetween: 0,
        loop: false,
        speed: 0,
        allowTouchMove: false,
        observer: false,
        observeParents: false,
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        on: {
            init: function () {
                console.log('Swiper initialized');
                // 给当前slide添加active类
                const activeSlide = this.slides[this.activeIndex];
                if (activeSlide) {
                    activeSlide.classList.add('active');
                }

                // 设置Swiper实例到管理器
                if (manager) {
                    manager.setSwiper(this);
                }

            },
            slideChange: function () {
                console.log('Slide changed to:', this.activeIndex);
                // 移除所有active类
                document.querySelectorAll('.swiper-slide').forEach(slide => {
                    slide.classList.remove('active');
                });

                // 给当前slide添加active类
                const activeSlide = this.slides[this.activeIndex];
                if (activeSlide) {
                    activeSlide.classList.add('active');
                }
            }
        }
    });


    // 监听pagination点击
    const paginationBullets = document.querySelectorAll('.swiper-pagination-bullet');
    paginationBullets.forEach((bullet, index) => {
        bullet.addEventListener('click', () => {
            console.log('Pagination clicked, index:', index);
            handlePaginationClick(index);
        });
    });
}

// 处理pagination点击
function handlePaginationClick(slideIndex) {
    console.log('=== Handling pagination click ===');

    if (!manager) {
        console.error('Manager not initialized');
        return;
    }

    // 停止当前播放
    if (manager.isPlaying) {
        manager.stopAll();
    }

    // 清空所有章节内容
    manager.clearAllContainers();

    // 更新按钮状态
    const toggleBtn = document.getElementById('swiper-toggle-btn2');
    if (toggleBtn) {
        toggleBtn.textContent = '▶';
    }

    // 找到对应的章节key
    const chapterKeys = Object.keys(containers);
    const targetChapterKey = chapterKeys[slideIndex];

    if (targetChapterKey) {
        console.log('Moving to chapter:', targetChapterKey);

        // 切换到对应的slide
        if (swiper2) {
            swiper2.slideTo(slideIndex);
        }

        // 重置manager状态
        manager.activeContainer = targetChapterKey;
        manager.currentContainerIndex = slideIndex;
        manager.currentItemIndex = 0;
        console.log('swiper pagination activeContainer:' + manager.activeContainer);
        // 延迟后开始播放该章节
        setTimeout(() => {
            if (!manager.isPlaying) {
                console.log('Starting playback for chapter:', targetChapterKey);
                const controlHandle = manager.getControlHandle();
                manager.clearAllContainers(); // 再次确保清空
                manager.activeContainer = targetChapterKey;
                controlHandle.togglePlay();

                // 更新按钮状态
                if (toggleBtn) {
                    toggleBtn.textContent = '⏸';
                }
            }
        }, 1000);
    }
}

// 独立自动播放函数
function startAutoPlay() {
    if (manager) {
        console.log('=== Auto-starting sequence ===');

        controlHandle = manager.getControlHandle();

        // 先清空现有内容
        manager.clearAllContainers();

        // 开始播放
        const isPlaying = controlHandle.togglePlay();
        console.log('Auto-play started:', isPlaying);

        // 更新按钮状态
        const toggleBtn = document.getElementById('swiper-toggle-btn2');
        if (toggleBtn) {
            toggleBtn.textContent = '⏸';
        }
    }
}



// 初始化播放/暂停按钮
function initPlayPauseButton() {
    const toggleBtn = document.getElementById('swiper-toggle-btn2');
    if (!toggleBtn) {
        console.error('Toggle button not found');
        return;
    }

    console.log('Initializing play/pause button');

    toggleBtn.addEventListener('click', function () {
        console.log('Play/Pause button clicked');

        if (!controlHandle) {
            controlHandle = manager.getControlHandle();
        }

        // 如果还没开始播放，先清空现有内容
        if (!manager.isPlaying) {
            manager.clearAllContainers();
        }

        const isPlaying = controlHandle.togglePlay();
        console.log('Is playing:', isPlaying);

        toggleBtn.textContent = isPlaying ? '⏸' : '▶';
    });
}

// 初始化fullpage（单独处理）
$(function () {
    var winD_w = $(window).width();
    console.log('Initializing fullpage.js');
    // 获取当前hash 
    let firstClick = true;  // 标记首次点击
    $('#Home_fullpage').fullpage({
        'anchors': ['home_ban', 'home_ban2', 'footer'],
        'responsiveWidth': 1024,
        'menu': '#menufull',
        'navigation': false,
        // ========== 开始修改：禁用URL hash记忆功能 ==========
        anchors: [], // 清空anchors，或者直接不设置
        lockAnchors: true, // 锁定锚点，禁止修改URL 
        // ========== 结束修改 ==========
        scrollingSpeed: 800,
        // 初始禁用滚轮
        autoScrolling: false,
        scrollBar: false,
        onLeave: function (index, nextIndex, direction) {
            console.log('Leaving section:', index, 'Going to:', nextIndex);
            console.log(firstClick);

            // 当离开第一屏时，启用滚轮滚动   
            $.fn.fullpage.setAutoScrolling(true);
            $.fn.fullpage.setAllowScrolling(true);
            $.fn.fullpage.setKeyboardScrolling(true);

            // 当离开第二页时，清空所有内容
            if (index === 1) {
                if (manager && manager.clearAllContainers) {
                    manager.clearAllContainers();
                    // 重置播放按钮状态
                    const toggleBtn = document.getElementById('swiper-toggle-btn2');
                    if (toggleBtn) {
                        toggleBtn.textContent = '▶';
                    }
                }
            }

        },
        // ========== 开始修改：添加afterLoad事件 ==========
        afterLoad: function (origin, destination, direction, trigger) {
            console.log('afterLoad事件触发');
            console.log('离开的section:', origin);
            console.log('进入的section:', destination);
            if (!manager.fullpage) {
                manager.fullpage = $.fn.fullpage; // 直接挂载 fullpage 方法对象
                console.log('Fullpage 方法已挂载到管理器');
            }

            // 检查是否进入第二屏（home_ban2）
            if (destination && destination.index === 1) {
                console.log('滚动到第二屏（home_ban2）');

                // 延迟执行，确保页面动画完成
                setTimeout(() => {
                    if (manager && !manager.isPlaying) {
                        console.log('第二屏处于暂停状态，继续播放当前位置');
                        console.log('当前章节:', manager.activeContainer);
                        console.log('当前章节索引:', manager.currentContainerIndex);
                        console.log('当前项目索引:', manager.currentItemIndex);

                        // 确保有控制句柄
                        if (!controlHandle) {
                            controlHandle = manager.getControlHandle();
                        }

                        // 从当前位置继续播放
                        manager.isPlaying = true;

                        // 显示当前项目
                        manager.showCurrentItem();

                        // 更新按钮状态
                        const toggleBtn = document.getElementById('swiper-toggle-btn2');
                        if (toggleBtn) {
                            toggleBtn.textContent = '⏸';
                        }

                        console.log('从当前位置继续播放');
                    } else if (manager && manager.isPlaying) {
                        console.log('第二屏已经在播放中');
                    } else {
                        console.log('manager未初始化或不存在');
                    }
                }, 500); // 等待fullpage滚动动画完成
            }
        }
        // ========== 结束修改 ==========
    });
});