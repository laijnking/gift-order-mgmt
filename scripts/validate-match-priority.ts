/**
 * 商品匹配优先级契约测试
 *
 * 验证 MATCH_PRIORITY 声明与 PRODUCT_MATCH_SCORES 一致，
 * 确保 code > barcode > spec > name 在所有匹配路径中生效。
 *
 * 运行：npx tsx scripts/validate-match-priority.ts
 */

import { MATCH_PRIORITY, PRODUCT_MATCH_SCORES, SKU_MATCH_ORDER } from '../src/lib/order-parse/match-policy';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ ${message}`);
    failed++;
  }
}

console.log('=== 商品匹配优先级契约测试 ===\n');

// Test 1: MATCH_PRIORITY 声明 code > barcode
console.log('1. MATCH_PRIORITY 声明顺序');
assert(MATCH_PRIORITY[0] === 'code', '第一位应为 code（编码）');
assert(MATCH_PRIORITY[1] === 'barcode', '第二位应为 barcode（条码）');
assert(MATCH_PRIORITY[2] === 'spec', '第三位应为 spec（规格）');
assert(MATCH_PRIORITY[3] === 'name', '第四位应为 name（名称）');

// Test 2: PRODUCT_MATCH_SCORES 分值与 MATCH_PRIORITY 一致
console.log('\n2. PRODUCT_MATCH_SCORES 分值一致性');
assert(
  PRODUCT_MATCH_SCORES.CODE_EXACT > PRODUCT_MATCH_SCORES.BARCODE_EXACT,
  `CODE_EXACT(${PRODUCT_MATCH_SCORES.CODE_EXACT}) > BARCODE_EXACT(${PRODUCT_MATCH_SCORES.BARCODE_EXACT})`
);
assert(
  PRODUCT_MATCH_SCORES.BARCODE_EXACT > PRODUCT_MATCH_SCORES.SPEC_EXACT,
  `BARCODE_EXACT(${PRODUCT_MATCH_SCORES.BARCODE_EXACT}) > SPEC_EXACT(${PRODUCT_MATCH_SCORES.SPEC_EXACT})`
);
assert(
  PRODUCT_MATCH_SCORES.SPEC_EXACT > PRODUCT_MATCH_SCORES.NAME_EXACT,
  `SPEC_EXACT(${PRODUCT_MATCH_SCORES.SPEC_EXACT}) > NAME_EXACT(${PRODUCT_MATCH_SCORES.NAME_EXACT})`
);

// Test 3: SKU_MATCH_ORDER 顺序一致
console.log('\n3. SKU_MATCH_ORDER 顺序一致性');
assert(SKU_MATCH_ORDER[0].type === 'code', 'SKU匹配第一位应为 code');
assert(SKU_MATCH_ORDER[1].type === 'barcode', 'SKU匹配第二位应为 barcode');
assert(SKU_MATCH_ORDER[2].type === 'spec', 'SKU匹配第三位应为 spec');
assert(SKU_MATCH_ORDER[3].type === 'name', 'SKU匹配第四位应为 name');

// Test 4: MIN_THRESHOLD 有效
console.log('\n4. 匹配阈值有效性');
assert(PRODUCT_MATCH_SCORES.MIN_THRESHOLD > 0, 'MIN_THRESHOLD 大于 0');
assert(PRODUCT_MATCH_SCORES.MIN_THRESHOLD <= PRODUCT_MATCH_SCORES.KEYWORD, 'MIN_THRESHOLD 不超过最低评分');

// Test 5: 降级匹配分值渐进
console.log('\n5. 降级匹配分值渐进');
assert(
  PRODUCT_MATCH_SCORES.NAME_CONTAINS > PRODUCT_MATCH_SCORES.SPEC_CONTAINS,
  'NAME_CONTAINS > SPEC_CONTAINS'
);
assert(
  PRODUCT_MATCH_SCORES.SPEC_CONTAINS > PRODUCT_MATCH_SCORES.CODE_CONTAINS,
  'SPEC_CONTAINS > CODE_CONTAINS'
);
assert(
  PRODUCT_MATCH_SCORES.CODE_CONTAINS > PRODUCT_MATCH_SCORES.KEYWORD,
  'CODE_CONTAINS > KEYWORD'
);

console.log(`\n=== 结果：${passed} 通过，${failed} 失败 ===`);

process.exit(failed > 0 ? 1 : 0);
