import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
/**
 * Catches synchronous render errors so a blank #root never hides the failure.
 */
export class RootErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }
    static getDerivedStateFromError(error) {
        return { error };
    }
    componentDidCatch(error, info) {
        console.error('[RootErrorBoundary]', error, info.componentStack);
    }
    render() {
        if (this.state.error) {
            return (_jsxs("div", { style: {
                    minHeight: '100vh',
                    padding: 24,
                    fontFamily: 'system-ui, sans-serif',
                    background: '#fafafa',
                    color: '#111',
                }, children: [_jsx("h1", { style: { fontSize: 20, marginBottom: 12 }, children: "Something went wrong" }), _jsx("p", { style: { marginBottom: 16, color: '#444' }, children: "The app hit an error while rendering. Check the browser console for details." }), _jsxs("pre", { style: {
                            padding: 16,
                            background: '#fff',
                            border: '1px solid #ddd',
                            borderRadius: 8,
                            overflow: 'auto',
                            fontSize: 13,
                        }, children: [this.state.error.message, import.meta.env.DEV && this.state.error.stack ? `\n\n${this.state.error.stack}` : ''] }), _jsx("button", { type: "button", style: { marginTop: 20, padding: '10px 16px', fontSize: 15, cursor: 'pointer' }, onClick: () => window.location.reload(), children: "Reload page" })] }));
        }
        return this.props.children;
    }
}
