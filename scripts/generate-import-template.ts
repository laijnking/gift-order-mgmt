/**
 * 生成礼品订单管理系统 - 订单录入Excel导入模板
 *
 * 使用方式: pnpm tsx scripts/generate-import-template.ts
 *
 * 模板说明：
 * - 列名与 src/lib/column-mapping-rules.ts 中的自动识别规则完全对齐
 * - 上传到 /order-parse 页面后，系统会自动识别这些列名
 * - "客户单据编号"列用于将多行数据合并为同一订单
 * - 标记 ⭐ 的列为必填，其余为选填
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const OUT_DIR = path.join(__dirname, '../data');
const OUT_FILE = path.join(OUT_DIR, 'import_template_orders.xlsx');

// 列定义：与 column-mapping-rules.ts 中的 PATTERNS 精确对应
interface ColumnDef {
  header: string;
  required: boolean;
  note: string;
  example: string;
  group: string;
}

const COLUMNS: ColumnDef[] = [
  // ===== 基础信息 =====
  {
    group: '基础信息',
    header: '客户单据编号',
    required: true,
    note: '⭐ 必填。相同编号的多行数据会被合并为同一订单。建议填写客户原始订单号。',
    example: 'ORD20260415001',
  },
  {
    group: '基础信息',
    header: '单据日期',
    required: false,
    note: '选填。订单日期，如 2026-04-15。',
    example: '2026-04-15',
  },
  {
    group: '基础信息',
    header: '发货方单据号',
    required: false,
    note: '选填。发货方侧的单据编号。',
    example: 'SUP-2026-0001',
  },
  {
    group: '基础信息',
    header: '客户代码',
    required: false,
    note: '选填。用于 SKU 映射查找。',
    example: 'C001',
  },
  {
    group: '基础信息',
    header: '客户名称',
    required: false,
    note: '选填。客户名称。',
    example: '泉州礼品公司',
  },
  {
    group: '基础信息',
    header: '发货方',
    required: false,
    note: '选填。指定的发货方名称。',
    example: '杭州发货方A',
  },
  {
    group: '基础信息',
    header: '业务员',
    required: false,
    note: '选填。业务员姓名。',
    example: '张三',
  },
  {
    group: '基础信息',
    header: '跟单员',
    required: false,
    note: '选填。跟单员姓名。',
    example: '李四',
  },

  // ===== 商品信息 =====
  {
    group: '商品信息',
    header: '客户商品名称',
    required: true,
    note: '⭐ 必填。商品名称，核心匹配字段。建议填写完整品牌+品名，如 "苏泊尔手持式吸尘器"。',
    example: '苏泊尔手持式吸尘器',
  },
  {
    group: '商品信息',
    header: '客户商品编码',
    required: false,
    note: '选填。客户侧的商品编码，用于 SKU 映射精确匹配。',
    example: 'SKU-001',
  },
  {
    group: '商品信息',
    header: '客户商品型号',
    required: false,
    note: '选填。商品规格型号，如 "03S57-AP"。用于精确匹配系统商品。',
    example: '03S57-AP',
  },
  {
    group: '商品信息',
    header: '数量',
    required: false,
    note: '选填。商品数量，默认为 1。',
    example: '2',
  },
  {
    group: '商品信息',
    header: '单价',
    required: false,
    note: '选填。商品单价，若填写则覆盖系统预设价格。',
    example: '299.00',
  },
  {
    group: '商品信息',
    header: '价税合计',
    required: false,
    note: '选填。含税总金额。',
    example: '338.37',
  },
  {
    group: '商品信息',
    header: '单台折让',
    required: false,
    note: '选填。每台折让金额。',
    example: '10.00',
  },
  {
    group: '商品信息',
    header: '增值税税率',
    required: false,
    note: '选填。增值税税率，如 0.13。',
    example: '0.13',
  },
  {
    group: '商品信息',
    header: '仓库',
    required: false,
    note: '选填。指定仓库名称。',
    example: '杭州仓库',
  },
  {
    group: '商品信息',
    header: '备注',
    required: false,
    note: '选填。商品行备注信息。',
    example: '请尽快发货',
  },

  // ===== 收货信息 =====
  {
    group: '收货信息',
    header: '收货人',
    required: true,
    note: '⭐ 必填。收货人姓名。',
    example: '张三',
  },
  {
    group: '收货信息',
    header: '收货电话',
    required: true,
    note: '⭐ 必填。收货人手机号或固定电话，用于联系收货人。',
    example: '13800138000',
  },
  {
    group: '收货信息',
    header: '收货地址',
    required: true,
    note: '⭐ 必填。完整收货地址，系统会自动解析出省市区。建议格式：省市区+详细地址。',
    example: '福建省厦门市思明区XX路88号',
  },

  // ===== 快递信息 =====
  {
    group: '快递信息',
    header: '快递公司',
    required: false,
    note: '选填。指定快递公司名称，如顺丰、圆通等。',
    example: '顺丰速运',
  },
  {
    group: '快递信息',
    header: '物流单号',
    required: false,
    note: '选填。快递单号或运单号。',
    example: 'SF1234567890',
  },

  // ===== 发票信息 =====
  {
    group: '发票信息',
    header: '需要开票',
    required: false,
    note: '选填。填写 "需要开票" 表示需要开具发票。',
    example: '需要开票',
  },
  {
    group: '发票信息',
    header: '收入名称',
    required: false,
    note: '选填。收入项目名称。',
    example: '商品销售',
  },
  {
    group: '发票信息',
    header: '应收金额',
    required: false,
    note: '选填。应收金额。',
    example: '338.37',
  },
];

// 示例数据行
const SAMPLE_ROWS: string[][] = [
  [
    'ORD20260415001',    // 客户单据编号
    '2026-04-15',       // 单据日期
    '',                  // 发货方单据号
    'C001',             // 客户代码
    '泉州礼品公司',       // 客户名称
    '',                  // 发货方
    '张三',              // 业务员
    '李四',              // 跟单员
    '苏泊尔手持式吸尘器', // 客户商品名称
    'SKU-001',          // 客户商品编码
    '03S57-AP',         // 客户商品型号
    '2',                // 数量
    '299.00',           // 单价
    '675.66',           // 价税合计
    '',                  // 单台折让
    '',                  // 增值税税率
    '',                  // 仓库
    '请加急发货',         // 备注
    '张三',              // 收货人
    '13800138000',       // 收货电话
    '福建省厦门市思明区XX路88号', // 收货地址
    '',                  // 快递公司
    '',                  // 物流单号
    '需要开票',           // 需要开票
    '商品销售',           // 收入名称
    '675.66',           // 应收金额
  ],
  [
    'ORD20260415001',    // 同订单号 → 合并为同一订单的不同商品行
    '2026-04-15',
    '',
    'C001',
    '泉州礼品公司',
    '',
    '张三',
    '李四',
    '苏泊尔电饭煲',       // 第二件商品
    'SKU-002',
    'SF40FC375',
    '1',
    '399.00',
    '450.87',
    '',
    '',
    '',
    '',
    '张三',              // 同收货人信息
    '13800138000',
    '福建省厦门市思明区XX路88号',
    '',
    '',
    '',
    '',
    '',
    '',
  ],
  [
    'ORD20260415002',    // 不同订单号 → 新订单
    '2026-04-15',
    '',
    'C002',
    '福州贸易商行',
    '',
    '王五',
    '赵六',
    '九阳破壁机',
    '',
    'JP-101',
    '1',
    '599.00',
    '676.87',
    '',
    '',
    '',
    '',
    '陈七',
    '13900139000',
    '广东省广州市天河区YY路22号',
    '',
    '',
    '',
    '',
    '',
    '',
  ],
  [
    'ORD20260415003',
    '2026-04-15',
    '',
    '',
    '',
    '',
    '',
    '',
    '苏泊尔保温杯',
    '',
    'BW-500ML',
    '5',
    '89.00',
    '502.85',
    '',
    '',
    '',
    '',
    '刘八',
    '15800158000',
    '浙江省杭州市西湖区ZZ路66号',
    '',
    '',
    '',
    '',
    '',
    '',
  ],
];

// 说明工作表的列宽
const SHEET_COL_WIDTHS = COLUMNS.map((c) => {
  const noteLen = c.note.length;
  const exampleLen = c.example.length;
  const headerLen = c.header.length;
  return Math.max(noteLen, exampleLen, headerLen) + 4;
});

function buildInstructionSheet(): XLSX.WorkSheet {
  const rows: string[][] = [];

  rows.push(['礼品订单管理系统 - 订单录入Excel导入模板说明']);
  rows.push([]);
  rows.push(['【使用说明】']);
  rows.push(['1. 请保留第1行（表头行）和第2行（填写说明行），在第3行起填写数据']);
  rows.push(['2. ⭐ 标记的列为必填项，请务必填写']);
  rows.push(['3. "客户单据编号"相同时，系统会将多行数据合并为同一订单']);
  rows.push(['4. 填写完毕后，访问「AI订单录入」页面，上传本文件即可自动解析']);
  rows.push(['5. 系统会自动识别标准列名，无需手动配置映射']);
  rows.push([]);
  rows.push(['【必填列】']);
  rows.push(['  · 客户单据编号（相同编号的行合并为同一订单）']);
  rows.push(['  · 客户商品名称']);
  rows.push(['  · 收货人']);
  rows.push(['  · 收货电话']);
  rows.push(['  · 收货地址']);
  rows.push([]);
  rows.push(['【支持识别的列名（别名）】']);
  rows.push(['  客户单据编号 可用别名: 客户订单号, 序号, 订单号, 商户订单号, 来源订单, 订单编号']);
  rows.push(['  商品名称 可用别名: 商品, 商品名, 货品名称, 品名, 客户商品名称, 客户商品名, 客户货品名称']);
  rows.push(['  商品编码 可用别名: 商品代码, 货号, 客户商品编码, 客户商品代码, 客户货号']);
  rows.push(['  规格型号 可用别名: 商品规格, 规格/型号, 规格型号, 型号规格, 型号, 客户商品规格']);
  rows.push(['  收货人 可用别名: 收件人姓名, 收货人姓名, 收件人, 会员昵称']);
  rows.push(['  收货电话 可用别名: 收件人手机, 收货人手机号, 收货人电话, 收件人电话, 手机号码, 联系电话, 电话']);
  rows.push(['  收货地址 可用别名: 收件人地址, 收货详细地址, 收货人地址, 收件地址, 详细地址']);
  rows.push(['  快递公司 可用别名: 物流公司, 承运商']);
  rows.push(['  物流单号 可用别名: 快递单号, 运单号, 快递号']);
  rows.push([]);
  rows.push(['【常见问题】']);
  rows.push(['  Q: 同一订单有多件商品怎么办？']);
  rows.push(['  A: 使用相同的"客户单据编号"填写多行，系统会自动合并']);
  rows.push([]);
  rows.push(['  Q: 列名与模板不完全一致可以吗？']);
  rows.push(['  A: 可以，系统支持多种别名识别，例如"商品名称"和"商品名"均可识别']);
  rows.push([]);
  rows.push(['  Q: 某些字段不需要填写怎么办？']);
  rows.push(['  A: 选填字段可以留空，系统会使用默认值（如数量默认1）']);
  rows.push([]);
  rows.push(['【模板版本】']);
  rows.push([`生成时间: ${new Date().toLocaleString('zh-CN')}`]);
  rows.push([`字段数量: ${COLUMNS.length} 列`]);

  const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(rows);

  // 设置说明页列宽
  ws['!cols'] = [{ wch: 80 }];

  return ws;
}

function buildTemplateSheet(): XLSX.WorkSheet {
  // 第1行：列名
  // 第2行：填写说明（用于提示用户）
  // 第3行起：示例数据

  const headerRow = COLUMNS.map((c) => c.header);
  const noteRow = COLUMNS.map((c) => c.note);
  const dataRows = SAMPLE_ROWS;

  const aoa: string[][] = [headerRow, noteRow, ...dataRows];
  const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(aoa);

  // 设置列宽
  ws['!cols'] = SHEET_COL_WIDTHS.map((w) => ({ wch: Math.min(w, 50) }));

  // 冻结第1行（列名）和第2行（说明）
  ws['!freeze'] = { xSplit: 0, ySplit: 2 };

  return ws;
}

function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const wb = XLSX.utils.book_new();

  // Sheet1: 填写模板（含示例数据）
  const templateSheet = buildTemplateSheet();
  XLSX.utils.book_append_sheet(wb, templateSheet, '订单导入模板');

  // Sheet2: 使用说明
  const instructionSheet = buildInstructionSheet();
  XLSX.utils.book_append_sheet(wb, instructionSheet, '使用说明');

  XLSX.writeFile(wb, OUT_FILE);

  console.log(`\n✓ 订单导入模板已生成: ${OUT_FILE}`);
  console.log(`  · 列数: ${COLUMNS.length}`);
  console.log(`  · 必填列: ${COLUMNS.filter((c) => c.required).length} (客户单据编号、客户商品名称、收货人、收货电话、收货地址)`);
  console.log(`  · 选填列: ${COLUMNS.filter((c) => !c.required).length}`);
  console.log(`  · 示例数据行: ${SAMPLE_ROWS.length}`);
  console.log(`\n  工作表说明:`);
  console.log(`  1. 订单导入模板 — 填写实际数据的工作表`);
  console.log(`  2. 使用说明 — 模板使用指南和列名别名说明`);
  console.log(`\n  使用方式:`);
  console.log(`  1. 复制"订单导入模板"工作表`);
  console.log(`  2. 保留第1行表头，删除第2行说明行和示例数据行`);
  console.log(`  3. 从第3行起填写实际订单数据`);
  console.log(`  4. 上传到系统「AI订单录入」页面`);
}

main();
