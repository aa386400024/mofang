export interface Option {
    value: string | number;
    label: string;
    icon?: string;
    desc?: string;
    [key: string]: any;
}
export interface OptionGroup {
    title?: string;
    showTitle?: boolean;     // 是否显示组名
    showDivider?: boolean;   // 此组下方是否加分割线
    options: (Option | OptionWithChildren)[];
}
export interface OptionWithChildren extends Option {
    children: OptionGroup[]; // 二级菜单，同样是 OptionGroup
}