import { extensionName } from './settings';

interface LocaleData {
  ui: {
    popup: Record<string, any>;
    settings: Record<string, any>;
    buttons: Record<string, any>;
    roles: Record<string, any>;
  };
}

class Localization {
  private currentLocale: string = 'en';
  private translations: Record<string, LocaleData> = {};
  private globalContext: any;

  constructor() {
    // 默认为英文，不需要加载翻译文件
  }

  public async initialize(globalContext: any): Promise<void> {
    this.globalContext = globalContext;
    
    // 尝试从浏览器或用户设置中获取语言
    const userLanguage = navigator.language.split('-')[0] || 'en';
    
    // 如果是中文，加载中文翻译
    if (userLanguage === 'zh') {
      await this.loadLocale('zh_CN');
      this.currentLocale = 'zh_CN';
    }
  }

  private async loadLocale(locale: string): Promise<void> {
    try {
      // 动态导入翻译文件
      const module = await import(`./locales/${locale}.json`);
      this.translations[locale] = module.default || module;
      console.log(`[${extensionName}] Loaded locale: ${locale}`);
    } catch (error) {
      console.error(`[${extensionName}] Failed to load locale: ${locale}`, error);
    }
  }

  public getText(key: string, defaultText: string): string {
    if (this.currentLocale === 'en') {
      return defaultText;
    }

    const keys = key.split('.');
    let result: any = this.translations[this.currentLocale];

    for (const k of keys) {
      if (!result) break;
      result = result[k];
    }

    return result || defaultText;
  }

  public translateElement(element: HTMLElement): void {
    // 翻译元素的文本内容
    if (element.dataset.i18nKey) {
      const key = element.dataset.i18nKey;
      const defaultText = element.dataset.i18nDefault || element.textContent || '';
      element.textContent = this.getText(key, defaultText);
    }

    // 翻译元素的属性
    if (element.dataset.i18nAttr) {
      const attrs = element.dataset.i18nAttr.split(',');
      for (const attr of attrs) {
        const [attrName, keyPath] = attr.split(':');
        if (attrName && keyPath) {
          const defaultValue = element.getAttribute(attrName) || '';
          element.setAttribute(attrName, this.getText(keyPath, defaultValue));
        }
      }
    }

    // 递归翻译子元素
    for (const child of Array.from(element.children)) {
      this.translateElement(child as HTMLElement);
    }
  }

  public translateUI(): void {
    // 翻译弹出窗口
    const popup = document.getElementById('charCreatorPopup');
    if (popup) {
      this.translateElement(popup as HTMLElement);
    }

    // 翻译设置页面
    const settings = document.querySelector('.charCreator_settings');
    if (settings) {
      this.translateElement(settings as HTMLElement);
    }
  }
}

export const localization = new Localization();