document.addEventListener('DOMContentLoaded', () => {
  // 页面加载完成后，开始抓取数据
  fetchData();
});

// 1. 获取数据的函数
async function fetchData() {
  try {
    // 请求同目录下的 data.json 文件
    const response = await fetch('./data.json');
    if (!response.ok) throw new Error('网络响应异常');
    
    const data = await response.json();
    // 数据拿到了，开始初始化页面
    initPage(data);
  } catch (error) {
    console.error('加载数据失败:', error);
    // 这里可以在页面上显示一个错误提示，或者加载备用数据
  }
}

// 2. 初始化页面的总指挥
function initPage(data) {
  renderSearch(data.search);
  renderNavAndContent(data.categories);
  
  // 渲染完 HTML 后，再绑定点击事件
  bindSearchEvents(data.search);
  bindTabEvents();
}

// --- 渲染模块：搜索区 ---
function renderSearch(searchData) {
  // A. 渲染搜索引擎按钮
  const enginesHtml = searchData.engines.map((engine, index) => {
    // 第一个引擎默认激活 (active)
    const activeClass = index === 0 ? 'active' : '';
    return `<button class="engine-btn ${activeClass}" data-url="${engine.url}" data-name="${engine.param}">${engine.name}</button>`;
  }).join('');

  // B. 渲染快捷小图标
  const quickLinksHtml = searchData.quickLinks.map(link => {
    return `
      <a href="${link.url}" class="mini-icon" target="_blank" title="${link.title}">
        <img src="${link.icon}" alt="${link.title}">
      </a>
    `;
  }).join('');

  // C. 注入到 HTML (我们需要在 index.html 里预留 id="search-container")
  const searchContainer = document.getElementById('search-container');
  if (searchContainer) {
    searchContainer.innerHTML = `
      <div class="search-engines">
        ${enginesHtml}
        <div class="divider"></div>
        ${quickLinksHtml}
      </div>
      <form id="searchForm" action="${searchData.engines[0].url.split('?')[0]}" method="get" target="_blank">
        <div class="search-box">
          <input type="text" name="${searchData.engines[0].param}" class="search-input" placeholder="Search..." autocomplete="off">
          <button type="submit" class="search-btn"><i class="ri-search-2-line"></i></button>
        </div>
      </form>
    `;
  }
}

// --- 渲染模块：导航栏 & 主内容区 ---
function renderNavAndContent(categories) {
  const navTabsContainer = document.getElementById('navTabs');
  const mainContentContainer = document.getElementById('main-content-area');
  
  let navHtml = '';
  let sectionsHtml = '';

  categories.forEach((cat, index) => {
    // 1. 生成顶部导航按钮
    const activeClass = index === 0 ? 'active' : ''; // 第一个默认激活
    navHtml += `
      <button class="tab-btn ${activeClass}" data-target="${cat.id}">
        <i class="${cat.icon}"></i> ${cat.navTitle}
      </button>
    `;

    // 2. 生成内容板块
    // 判断是否有子分组 (Tools 专属逻辑)
    let gridContent = '';
    
    if (cat.groups) {
      // 如果有分组 (比如 Tools)
      gridContent = cat.groups.map(group => {
        const openAttr = group.isOpen ? 'open' : '';
        const cards = renderCards(group.items);
        return `
          <details ${openAttr}>
            <summary>${group.name}</summary>
            <div class="grid">${cards}</div>
          </details>
        `;
      }).join('');
    } else {
      // 普通板块 (比如 AI)
      gridContent = `<div class="grid">${renderCards(cat.items)}</div>`;
    }

    // 组装 Section HTML
    sectionsHtml += `
      <div id="${cat.id}" class="category-section ${activeClass}">
        <div class="section-header">
          <i class="${cat.icon}" style="font-size: 1.8rem; color: ${cat.titleColor};"></i>
          <div class="section-title">${cat.sectionTitle}</div>
        </div>
        ${gridContent}
      </div>
    `;
  });

  // 注入 HTML
  if (navTabsContainer) navTabsContainer.innerHTML = navHtml;
  if (mainContentContainer) mainContentContainer.innerHTML = sectionsHtml;
}

// 辅助函数：生成卡片 HTML
function renderCards(items) {
  return items.map(item => {
    // 处理 GitHub 这种没有图片 icon 的情况
    let iconHtml = '';
    if (item.icon) {
      iconHtml = `<img src="${item.icon}" alt="${item.title}">`;
    } else if (item.iconSymbol) {
      iconHtml = `<i class="${item.iconSymbol}" style="font-size: 36px; color: ${item.iconColor}; background: ${item.iconBg || 'transparent'}; border-radius: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;"></i>`;
    }

    return `
      <a href="${item.url}" class="card" target="_blank">
        ${iconHtml}
        <div class="card-info"><h3>${item.title}</h3></div>
      </a>
    `;
  }).join('');
}

// --- 交互逻辑模块 ---

// 绑定搜索切换事件
function bindSearchEvents() {
  const engineBtns = document.querySelectorAll('.engine-btn');
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.querySelector('.search-input');

  engineBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // 样式切换
      engineBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // 功能切换
      const url = btn.getAttribute('data-url');
      const paramName = btn.getAttribute('data-name');
      
      searchForm.action = url.split('?')[0];
      searchInput.name = paramName;
    });
  });
}

// 绑定 Tab 切换事件
function bindTabEvents() {
  const tabs = document.querySelectorAll('.tab-btn');
  const sections = document.querySelectorAll('.category-section');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // 按钮样式切换
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // 内容显示切换
      const targetId = tab.getAttribute('data-target');
      sections.forEach(section => {
        section.classList.remove('active');
      });
      const targetSection = document.getElementById(targetId);
      if (targetSection) targetSection.classList.add('active');
    });
  });
}