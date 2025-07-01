import { Menu, MenuItem, BrowserWindow } from 'electron'
import type { BrowserWindow as ElectronBrowserWindow } from 'electron'
export function setupMainContextMenu(mainWindow: BrowserWindow) {
    mainWindow.webContents.on('context-menu', (event, params) => {
        const { isEditable } = params
        const menu = new Menu()

        if (isEditable) {
            menu.append(new MenuItem({
                label: '剪切',
                role: 'cut',
                accelerator: 'Ctrl+X',
                enabled: params.editFlags.canCut,
            }));
            menu.append(new MenuItem({
                label: '复制',
                role: 'copy',
                accelerator: 'Ctrl+C',
                enabled: params.editFlags.canCopy,
            }));
            menu.append(new MenuItem({
                label: '粘贴',
                role: 'paste',
                accelerator: 'Ctrl+V',
                enabled: params.editFlags.canPaste,
            }));
            menu.append(new MenuItem({
                label: '粘贴并搜索',
                click: (_menuItem, browserWindow, _event) => {
                    if (browserWindow) {
                        (browserWindow as ElectronBrowserWindow).webContents.paste();
                        // 通知前端执行自定义搜索
                        (browserWindow as ElectronBrowserWindow).webContents.send('input-paste-search', params)
                    }
                },
                enabled: params.editFlags.canPaste,
            }));
            menu.append(new MenuItem({
                label: '删除',
                role: 'delete',
                accelerator: 'Del',
                enabled: params.editFlags.canDelete,
            }));
            menu.append(new MenuItem({ type: 'separator' }));
            menu.append(new MenuItem({
                label: '全选',
                role: 'selectAll',
                accelerator: 'Ctrl+A',
                enabled: params.editFlags.canSelectAll,
            }));
            menu.append(new MenuItem({ type: 'separator' }));
            menu.append(new MenuItem({
                label: '管理搜索引擎和网站搜索',
                click: (menuItem, browserWindow, _event) => {
                    if (browserWindow) {
                        (browserWindow as ElectronBrowserWindow).webContents.send('open-search-setting');
                    }
                }
            }));
            menu.append(new MenuItem({
                label: '总是显示完整网址',
                click: (menuItem, browserWindow, _event) => {
                    if (browserWindow) {
                        (browserWindow as ElectronBrowserWindow).webContents.send('always-show-full-url');
                    }
                }
            }));
            menu.popup({ window: mainWindow! });
            return;
        
        } else {
            // 非输入区域做全局菜单
            menu.append(new MenuItem({
                label: '返回',
                accelerator: 'Alt+Left',
                click: () => mainWindow?.webContents.navigationHistory.goBack(),
                enabled: mainWindow?.webContents.navigationHistory.canGoBack() ?? false
            }))
            menu.append(new MenuItem({
                label: '前进',
                accelerator: 'Alt+Right',
                click: () => mainWindow?.webContents.navigationHistory.goForward(),
                enabled: mainWindow?.webContents.navigationHistory.canGoForward() ?? false
            }))
            menu.append(new MenuItem({ type: 'separator' }))
            menu.append(new MenuItem({
                label: '重新加载',
                accelerator: 'Ctrl+R',
                click: () => mainWindow?.webContents.reload()
            }))
            menu.append(new MenuItem({
                label: '另存为...',
                accelerator: 'Ctrl+S',
                click: () => mainWindow?.webContents.savePage('page.html', 'HTMLComplete')
            }))
            menu.append(new MenuItem({ type: 'separator' }))
            menu.append(new MenuItem({
                label: '查看网页源码',
                accelerator: 'Ctrl+U',
                click: () => mainWindow?.webContents.send('view-source')
            }))
            menu.append(new MenuItem({
                label: '检 查',
                click: () => mainWindow?.webContents.openDevTools({ mode: 'undocked' })
            }))
        }
        menu.popup({ window: mainWindow! });
    })
}