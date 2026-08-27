import { Component } from "react";
import { useLang } from "../i18n";

class ErrorBoundaryClass extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const { t } = this.props;

    return (
      <section className="panel empty-state" style={{ margin: "3rem" }}>
        <h2>{t('页面遇到了意外错误')}</h2>
        <p>{t('请刷新页面重试。')}</p>
        <div className="empty-state-action">
          <button className="blue-button" type="button" onClick={() => window.location.reload()}>
            {t('刷新页面')}
          </button>
        </div>
      </section>
    );
  }
}

// 函数包装层：注入 i18n t 函数（Class 组件无法直接使用 hook）
export function ErrorBoundary({ children }) {
  const { t } = useLang();
  return <ErrorBoundaryClass t={t}>{children}</ErrorBoundaryClass>;
}
