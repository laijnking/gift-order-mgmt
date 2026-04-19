-- 导入供应商档案
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('44a93007-a844-4165-8635-4385a88feb87', '广州超品汇', '', '聚水潭', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('5e561dc9-834a-48ab-bf5e-b4b23ab921f0', '广州首映礼', '', '聚水潭', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('3940838b-ae90-425d-a237-bd4601dcaa61', '邵武万家美', '', '聚水潭', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('d464e221-3107-425d-b7ba-c4718a5d7ace', '常州梁业', '', '其他', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('aa6bff71-11e9-4620-8de3-48d35e986680', '北京金鼎越胜', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('6c20a4a9-47e8-47f7-aa57-b5d4a12daab4', '苏州合则盛', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('228303dc-0ad6-4f0e-9aa6-cc42f694f6a4', '浙江云战', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('3cd88a1d-3739-40f8-af81-22d8b20c6cb7', '上海谦半天猫', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('d261ff39-39fb-420b-abaa-cad23772d689', '上海毅道', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('44277ff7-96a9-439a-8eb0-cd473122bb40', '深圳碧然晨', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('dea83d3d-d793-4fde-a433-a6bdfc7b158a', '张家港米盛', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('7d99bad5-a3c2-41da-a618-22d4d17baa79', '上海至梵', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('7b48eacd-8087-4c58-ab55-be754410fccf', '杭州舟亢', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('a5f3fb5e-3162-4c73-aa13-255fea9bee72', '广州威泽', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('1ea94bca-bfbe-4e20-9169-7407bf745626', '深圳西贝阳光', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('ea1483b1-03f5-42e3-b209-939ab6cec979', '广东云海', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('dac4ab38-8505-4a8a-9bf9-419dfa9e5611', '广州超品汇2C主仓', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('4b7cd38d-6f31-493c-9ece-d4ea0c863651', '天津倾心', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('7f2e6cf7-7573-4b70-8bc2-7939b83fe9c0', '慈溪腾杰', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('753be4d9-d1f0-48fa-976a-c2244f84256d', '成都拓普壹', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('4f5ac578-16ec-4814-8339-f35ce537ba8b', '杭州怡霖', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('ae5d67ee-07cd-421d-9a32-9c6821aff2c9', '永康珏灵', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('898b2ae5-5abc-40a5-913b-d63be6f1712f', '中山奔和', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('8456905d-b428-4215-a728-d20c2720eaa4', '北京兰瑞基', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('89027eb1-34d8-49a8-987a-6057bdd212e1', '广州齐林', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('02b80f18-cc7e-4ff1-b438-0835145dca65', '山东怡坤', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('fa2468f6-266d-4e14-b0ba-c1b95aa3ecd6', '北京国泰昌荣', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('f21d16a6-5e5b-4905-a0b5-ee88ed0b2c12', '安徽艾森格', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('99c3f398-4ae9-403e-80ce-260032162c35', '山东新瑞', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('a87b5deb-ea94-4bbb-8e51-990c11d44281', '上海飞通', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('db06e0a1-f03f-42d8-8ba0-3b71e70d5e98', '广州金运', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('43180a97-3610-4e60-b141-4423b32d0820', '佛山多品博美', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('f5cd1763-d242-47ed-9654-84b893079a4a', '杭州世净', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('78cf3f23-1aa6-4b7f-b8e0-331818da29ee', '福建翼盛通', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('33e4dbff-2e61-41df-94e6-2f2937d5caab', '广东金达', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('a8ee60ab-4405-45d1-b9e2-e144cc270e44', '烟台尚讯', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('fd158252-9ac0-4cb0-8ae5-7a388ee6e46c', '南京悦途', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('65295a5a-5100-4530-a6fe-848c1d73a763', '许桂波-昆明浩帆', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('e431fc5c-a632-4874-a60d-48e0057706e3', '上海海淮', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('c84b3ebd-4e59-4323-bc19-1488652f47e7', '中山合利和', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('fa5f5a84-bd58-40e0-a3bf-12674a6b4308', '京东飞通企业账户', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('c82d374c-dd96-4260-b468-4142da9a3864', '沈阳旺得福', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('a5e9b9f9-1136-4e20-a972-9099939f7d5b', '广州六里', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('d078967b-fc73-4754-a302-fd964bdccfa3', '深圳万川', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('464d5285-084c-41f6-b4eb-5b04d74d4cfc', '杭州艾特未来', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('4425e07f-c02e-4b3f-99b3-87cf864bafff', '江苏金舜源', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('2d25cd99-5e7f-44a9-960f-44fdf7ab4807', '中山钜泽', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('aa1b8fd9-0b55-4c61-83ab-829331627f06', '义乌好吉利', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('65ce4326-c2db-47da-8276-4f667c690619', '上海礼素', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('e544d697-5972-4ff7-af85-861defe68a10', '辽宁苏泊尔', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('02fb7a3b-5001-4ae1-a6a3-7678d9e5f560', '武汉沃克尔', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('fde2758d-c819-45fd-89ad-b8b16989dd17', '许丽纯-上海飞通京东', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('2260a314-b6a0-402d-a126-b7aaf8f8b9ea', '深圳红紫金', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('01e64a65-7d6e-4ffd-9b42-56adcd35d6f2', '上海真礼', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('1405a2e1-7cf0-4aa0-b626-41d787624ecc', '许桂波-巴南渝跃', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('006a43d7-9aec-4c3f-8471-c3235edd0ddf', '揭阳汇达', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('67efba73-c0a8-4c71-b9fe-a1be8c7d09ba', '超品汇-深圳西贝阳光', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('1d1dac53-6aef-49e1-84dd-4f8ae3136532', '江苏格来德', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('9214c341-6ccf-4c8a-b124-2995ea92622e', '北京小阳', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('0ffb8c3c-5498-4a30-85d3-a2015146dcc6', '许桂波-京东飞通企业账户', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('a148c2ac-dbb5-4cca-956b-502c2e701d04', '上海明心', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('bf4c0815-4561-426b-968c-48e388401b1f', '深圳苏泊尔一件代发', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('4a9cd169-82b5-469d-b9c1-a30ad09948c8', '许桂波-京东企业账户', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('70838375-2bd0-4b49-8d53-480c57eb5054', '上海松蓁', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('d74b64a3-bab2-4658-ba90-07fda6a391fd', '山东惠宝淘宝', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('3a480185-f3ae-495e-a960-e8b4d040bd11', '深圳阜昌', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('d55e5139-deb9-4d98-a709-b33a690a61af', '上海艺冉', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('4a895ebd-d6e7-4c10-a60f-a9e3da04a7c8', '许桂波-京东', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('35ac45cf-0e56-4e76-a55b-068be6f99200', '山东新瑞小店', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('5ce2576c-7379-4151-b0c0-7b2d131304cb', '深圳益庆丰', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('3eaa9f30-be43-4d71-93f7-e59dc2fc7f75', '河南聚百宏', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('6cea1d4b-8249-4a2c-8169-8970a3ee6017', '深圳腾辉', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('8bb44d72-37ea-4013-90ec-9ebf6251c8b7', '宁波中央电暖', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('3a3969e7-b1d0-4128-aedf-4f5d2a22b791', '杭州九阳豆业', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('de3f3410-5a5b-418c-9f91-5023dde478d2', '许丽纯-淘宝', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('c2fe4dfb-c807-4811-a50c-efaa6d25dca3', '广州超品汇2C销退次品仓', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('6a662673-a9f6-4e86-be84-671bcf3bcef7', '许丽纯-京东', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('fb1c3673-8080-41fd-9518-705fb953af3e', '许桂波-先锋京东', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('108f638f-cd37-4418-afdd-1c911fb8e2dd', '上海众繁', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();
INSERT INTO suppliers (id, name, short_name, type, contact, send_type, province, can_jd, express_restrictions, cost_factor, is_active, created_at, updated_at)
VALUES ('002b1c11-548c-4be3-a71c-9afc9875af86', '许桂波-拼多多', '', '三方', '', '一件代发', '', false, '[]', 1, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    short_name = EXCLUDED.short_name,
    type = EXCLUDED.type,
    updated_at = NOW();

-- 导入仓库档案
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', 'WH001', '首映礼省内仓', '', '自有', '', '', '广东', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('1397cc82-bf0a-4b07-9092-29f1a760b265', 'WH002', '广东云海仓库', '', '三方', '', '', '广东', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('f3af7a7d-e229-4d8a-aa9c-d3d8e27be32a', 'WH003', '山东怡坤仓库', '', '三方', '', '', '山东', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('820773b1-086f-4532-ad8f-b5585b2b2314', 'WH004', '天津倾心仓库', '', '三方', '', '', '天津', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('65fede50-a884-45f4-bb7a-cc514ab8adeb', 'WH005', '杭州舟亢仓库', '', '三方', '', '', '浙江杭州', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('4ab6920a-37d1-4bd1-8af2-5b8b353090a1', 'WH006', '上海至梵仓库', '', '三方', '', '', '上海', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('5ed0460f-0fe0-490a-8cd8-d3bb21b86895', 'WH007', '成都拓普壹仓库', '', '三方', '', '', '四川成都', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('48b78936-6ea5-476f-b32f-1f22decc648b', 'WH008', '上海飞通仓库', '', '三方', '', '', '上海', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('c16bd7b5-ec9d-4e3e-9899-d6d3b53081b0', 'WH009', '张家港米盛仓库', '', '三方', '', '', '江苏张家港', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('2c3ec2c6-4e3d-42fd-aff3-be338456626b', 'WH010', '3.23杭州怡霖', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('d5528fe9-a81c-4024-8a80-193d067d32d4', 'WH011', '2.25常州梁业', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('976dc1dc-77a9-4e6f-ba88-c22f41e5f33c', 'WH012', '3.23北京国泰昌荣', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('2d5a96e6-8931-4923-82e3-59a8ef71e464', 'WH013', '3.16江苏金舜源', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('8f8d528a-3994-41d4-9df6-8fffd0f253ab', 'WH014', '3.26佛山多品', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('e571525e-440d-47b4-a7bf-00cd8970d3f1', 'WH015', '3.17红紫金', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('fbedbdad-f511-459a-b59e-78a64ac2ea8d', 'WH016', '3.23深圳碧然晨', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('eb3dd62b-1ad4-4b0e-81de-8bf8723cd835', 'WH017', '3.23安徽艾森格', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('f8b74d05-6ee8-4ffa-a862-5b05e90bcef9', 'WH018', '3.22山东新瑞', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('caa6724e-b44a-4110-9bf6-b7515d318390', 'WH019', '3.23苏泊尔电商-海淮', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('7f4f9a30-1f1f-4045-ba14-fe92947db068', 'WH020', '3.16昆明浩帆', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('88bbdae5-b547-4cfc-a7ce-dfa3fcbd86e8', 'WH021', '3.23福建翼盛', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('3551ac54-37d0-4175-bf27-66e9ac8ecb41', 'WH022', '3.23广州威泽', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('9bb57aee-0a34-4e03-828e-92f632c8520b', 'WH023', '12.26深圳苏泊尔', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('1f468925-186b-4189-a67b-77abbf3421dc', 'WH024', '2.28武汉沃克尔-六安', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('c354edb3-eeba-4c3a-90de-96e6f174b1a0', 'WH025', '1.10江苏新合纵', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('d6307d8b-1e71-4d24-aac0-226b9461e1d6', 'WH026', '3.4刘志峰', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('3631855e-dba7-4d59-9e51-ef225eece3d4', 'WH027', '3.23电商工厂库存', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('ed7463f4-8514-48d5-92f1-8f2b412fd52c', 'WH028', '2.7飞通京东', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('b56533db-a333-454e-a51e-659be0748431', 'WH029', '1.16苏泊尔不接团单品', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('a7c53be7-d67f-437c-ad79-2418ae94f549', 'WH030', '3.25武汉杯壶苏泊尔工厂', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('ece70502-aab9-46ac-84fd-554e85d8f705', 'WH031', '3.3九阳商用豆浆机', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('180f1ad9-b1ea-4e6c-af3b-7980337fd4e7', 'WH032', '九阳新渠道管控型号', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('00f61d06-f816-4d50-881e-d1033a36feda', 'WH033', '3.26九阳工厂库存', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('a5d7091f-0f4f-45cd-9353-dd7fac5fd4bc', 'WH034', '3.23兰瑞基', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('a55b5c7b-53a8-4b97-9b10-42897229ed03', 'WH035', '3.23慈溪腾杰', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('c099fb92-0ee2-41ec-af89-4e0c6917793c', 'WH036', '3.23苏州合则盛', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('9933b0f3-5011-44fd-8edf-3814311fd333', 'WH037', '3.16沈阳旺得福', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('dead1d62-b76e-47e6-bba5-2f2144c218d4', 'WH038', '3.5上海毅道', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('58f6194a-d771-4160-80d6-638663265136', 'WH039', '2.24中山合利和', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('f316dd6f-6cdc-486a-97b5-255d82e1228d', 'WH040', '3.18九阳益庆丰', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('30da098d-8c9e-4831-baf8-5f4d3093b609', 'WH041', '12.1金鼎越胜', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('3d8c3dbf-63d1-4792-a6e4-160755f1fdb3', 'WH042', '1.8深圳西贝阳光', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('2545a7b1-aee2-48dd-9ff3-375d4476fb8d', 'WH043', '先锋夏季', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('36c45a4e-bbdc-4001-a29b-4d99819527a4', 'WH044', '12.11先锋冬季', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('7919b288-e057-40b2-baba-55afb63e3b5f', 'WH045', '3.24九阳2C', '', '三方', '', '', '未知', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('fa0ea2b2-b341-42bd-8c7f-eb5704ac9de0', 'WH046', '中山奔和仓库', '', '三方', '', '', '广东中山', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();
INSERT INTO warehouses (id, code, name, short_name, type, contact_person, contact_phone, address, province, city, is_active, created_at, updated_at)
VALUES ('8ec18d5f-e821-4231-90f4-49b49229acc8', 'WH047', '利仁仓库', '', '三方', '', '', '北京', '', '', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    updated_at = NOW();

-- 导入库存数据
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('357eaaea-1e5d-44af-86c6-d10de295a423', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', '30N1', '九阳电饭煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c5e15f25-ed16-4d9a-9d8d-688924ba72d8', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', '30N1U', '九阳电饭煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('91f0dc14-055f-4ab7-a459-02dec8d505b0', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'B145F-WR525白', '九阳保温壶', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('149652b9-2892-495c-bddb-dfe6fd22a1d1', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'B16V-WR528(白)', '九阳保温杯', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('3e4198bf-a98e-47c4-8ba0-28588bdcc962', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'B18T-WR560(粉)', '九阳保温提锅', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('480114cc-33fb-437f-9d85-e3b73a86037e', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'B48-WV901', '九阳保温杯', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e19e639e-9db2-4812-8e77-b4adc3eef912', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'C22-IA02', '苏泊尔电磁炉', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('fd2362f3-19f1-41e1-831b-29d35ee3b406', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'C22-IH90', '苏泊尔电磁炉', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('552df3e8-a785-4d95-b087-ca845e932f5a', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'C22S-N219-A1', '九阳电磁炉', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ff078be6-28c1-40d1-a53c-a27139e7dcdb', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'C22S-N411', '九阳电磁炉', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('746ee1e2-2cb5-45be-bcfd-7a42a099c07d', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'C22S-N532', '九阳电磁炉', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('736e7dd1-a983-4498-baf2-152ba9da7654', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DG08Z-GD106', '九阳电炖锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9d91ffe0-754c-4d51-a4f4-74a905f32e64', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DG10G-GD103', '九阳电炖锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ce804df6-0c7b-454a-8589-53c11df1289a', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DG20G-GD160', '九阳电炖锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5c292308-d130-4788-9e2f-9a04c48624ad', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DG30Z-GD3006BQ', '九阳电炖锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('37ee76ad-863d-492c-9b97-a1db17742769', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DG30Z-GD517', '九阳电炖锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('afa3899e-b1e6-486a-8c5e-6f73d15d398a', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DG40K-GD405', '九阳电炖锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('90e5a7a0-d30c-40a3-9536-eb0e1b36cc98', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DG40Z-GD410', '九阳电炖锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('238208d0-8e75-41d4-bd60-ba63c8ec0ccb', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DJ06X-D525', '九阳豆浆机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b4ed76ea-7fa1-4797-affa-e75302395d28', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DJ10P-D920', '九阳豆浆机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('cddb4e52-a72d-489f-ac0b-0c0b0c3a2b75', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DJ10X-D290', '九阳豆浆机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c654bdf2-e469-460f-a2fb-2f6af31d2963', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DJ10X-D650', '九阳豆浆机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b045b599-b17f-4765-b0d9-9e8aef17df02', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DJ13B-D08EC', '九阳豆浆机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('56feade1-1830-42c1-a401-09b4b66c3c70', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DZ175HG-GZ126', '九阳电蒸锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('682cbf63-5fb7-435f-bcfc-94394d7b3f88', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DZ180HG-GZ180', '九阳电蒸锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('adc087ee-feff-48d7-a5cb-9cef8d0a8381', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'EB30MAT01', '苏泊尔新陶养生煲.惠系列', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0ec9ffb5-7e81-4e59-8148-ed4e7fe3aa79', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'EC30JCH01', '苏泊尔炒锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('99c88092-2ab7-4f6d-b39f-5fa22a192c6d', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'EJ30HAN01', '苏泊尔煎锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6541bc55-09b8-4031-9d86-0c62d4d66d7e', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'ES40HS01', '苏泊尔水壶', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('3d071988-6810-4844-98cf-e541da93975c', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'ESP-301A', '苏泊尔电熨斗', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('81d5e3f2-a437-47fe-8b20-ad866a35527f', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'ET22MAP01', '苏泊尔汤锅', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('186c52fe-28e3-4df3-a5e3-28e468b63811', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'F-12FZ618', '九阳电饭煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f2d214ce-6d3c-4cae-887d-b3f5fa2f7c52', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'F-20FY2', '九阳电饭煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8ab8ab5b-3d66-4c54-8533-40c033fac2b3', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'F-30F315L', '九阳电饭煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6e4c3b93-cf34-41b8-8cb7-46c58d7a59a8', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'F-30FZ319', '九阳电饭煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b53031db-c1fa-404a-8a66-0acccd5ec9f9', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'F-40F316L', '九阳电饭煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('248a6817-383e-4918-944b-5313dd68da7b', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'F-40FZ4399', '九阳电饭煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('bf1cf78e-cdba-4032-b268-68c5be11850c', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'F-40FZ815', '九阳电饭煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4387b6d7-6fc8-49f3-b038-d1c3b69ff8d9', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'F-40FZ820', '九阳电饭煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a7006845-9c9e-4773-a9b6-d0c5f51aace7', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'F10H-FH200', '九阳饭盒', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b3fefb01-a57b-49c0-ae11-91b74fc0549c', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'F40T-F372', '九阳电饭煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c04e43f7-05a5-41bd-9b05-13803cd8229b', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'GJ3723P805', '苏泊尔电热烧烤炉', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4006e41b-487c-410d-9a13-189cf5ffec05', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'GJ5025S835', '苏泊尔电火锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('39a273a3-a7e9-49e2-9b5b-233d19e49f30', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'H22-X3', '九阳电陶炉', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ff9d2d25-ea3e-4675-a711-039076339c15', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'H2222FK621', '苏泊尔电火锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b55971ff-7a69-480d-be7c-9f4b0fd3d7a3', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'H2626FK823', '苏泊尔电火锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c7a5ab6f-07fb-4025-89df-1bf0fb627fe7', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'H30YK706', '苏泊尔电火锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('67b237bc-e1bc-45e2-843a-94d1ca7bf969', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'HD613RC-20', '先锋欧热快', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('77c32c09-233c-4ebb-91cf-d9600d10a60d', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'HG10-G71S', '九阳电火锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1e5705c0-e33b-469f-befd-ba5b86a06644', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'HG18-G153', '九阳电煮锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f4694b26-24d0-4b07-8279-68e8875b1c3b', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'HG25-G201S', '九阳电火锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('39bd006b-3cce-4957-a247-cfea1a9bfa15', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'HG25-G211', '九阳电煮锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1d8d26a7-f4d5-48cd-a01e-e75750376d5a', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'HG25-G211S', '九阳电火锅', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('dec254d1-cecb-4842-8bb8-f7cc22673bf3', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'HG60-G650', '九阳多功能锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('920cf650-f1cb-4517-8e73-344ea77b62ca', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'HG60-G665', '九阳电火锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('36e780f5-efba-40be-8137-1ac81ba93840', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'HG70-G766', '九阳电火锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('2b77c94c-66e2-4590-a75b-8fc0ead17a51', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'HLW-82A-280', '苏泊尔加湿器', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b1cd514a-c6be-4d76-ac80-0cfaab649efd', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JD32AQ18', '苏泊尔煎烤机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0b2ef857-153e-4f7d-b25d-4115cb4d54c7', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JD3322D12', '苏泊尔多功能锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('628a9fc6-fb1a-44f6-b5c0-84235c351116', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JJ20A817-70', '苏泊尔薄饼机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('3c9788b6-c755-4d57-9f0c-01fb4b78583b', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JJ30A648', '苏泊尔煎烤机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('80cac5c0-874a-4695-b259-707a4589f2c8', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JJ30A69', '苏泊尔煎烤机', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c2645bd8-9298-45b2-ae84-9d012f2a2dbf', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JJ30RQ801', '苏泊尔煎烤机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('3a1aa2b6-8a86-4067-bdab-1ae9abf06ce4', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JK-30K09Pro', '九阳煎烤机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('bf90e456-04eb-4918-8e30-7fdee606e764', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JK13-GK160', '九阳电饼铛', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f911d220-fbbb-4b8f-931c-f3362a423108', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JK30-GK535', '九阳煎烤机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('2676f898-c39f-4344-b7fb-1840d32cbaaf', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JK30-GK535Pro', '九阳电饼铛', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('2e099258-b4fe-43a3-99ca-2265db2abd60', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JK30-GK653', '九阳煎烤机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f75cefbc-959e-4495-9426-89b46604e9d9', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JRD07', '苏泊尔绞肉机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('aa80bbd2-394a-411c-adb6-6f5b2b21dbe2', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JT30A818', '苏泊尔煎烤机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('110bd677-c386-47cd-b853-0c4b71c3c341', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JT34RQ17', '苏泊尔煎烤机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('91aaaa87-4965-491b-9dc0-a8db3c474cf5', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JYL-C012', '九阳破壁料理机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('31d61e4f-4f39-4064-bd5d-8d719b449b88', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JYS-100S02', '九阳营养星商用豆浆机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('fb34bb85-5d22-4222-85be-c7cd8d1e2f53', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JYW-RC312', '九阳超滤净水机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1eb898ec-0a67-4948-970c-7bb2528d7ae9', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'K10D-WY107', '九阳养生壶', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('497d5aaa-37e1-4b04-8ce5-33b0abec98d2', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'K15-F620', '九阳开水煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('26123853-d933-4417-8d28-a631de96c901', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'K15D-WY345', '九阳养生壶', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('032a9069-480c-48b2-9aed-5165fa7eba67', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'K15F-WY155', '九阳养生壶', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('3c6f277e-c9c0-4b98-be20-31bf557cef62', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'K20FD-W518', '九阳电热水壶', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('681548f4-7903-4615-bdc6-e6cdea659106', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'K30D-WY606', '九阳养生壶', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('fb16d2a3-b4e5-47bb-86d8-80e5fd392cc5', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KC36FY10琥珀棕', '苏泊尔保温杯', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6a649276-d1f8-4e41-a1b3-e4b85511e26a', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KC43AD5B', '苏泊尔保温杯', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('53db3dec-4fde-4e07-838b-096c43bc6c3a', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KC45FP11橄榄绿', '苏泊尔保温杯', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ad99d419-e0a6-4760-a2a3-1716f2a2523c', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KC45FR20轻盈粉', '苏泊尔保温杯', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('91674f50-e7e0-4449-925a-98b565b67e7c', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KC80EP10薰衣草紫', '苏泊尔焖烧杯', 3, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1e22e6e6-5d9f-4ed3-a602-744f4fdcd1c1', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KCV10AE20海滨蓝', '苏泊尔保温壶', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('cc79d493-70f5-48df-bdca-97cb14c81195', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KCV25BP20', '苏泊尔保温壶', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4f4e363c-857a-4b94-8d2e-ccac63a2cc35', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KCV45DB10夜影黑', '苏泊尔保温杯', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('765e6989-5aeb-49c5-9b38-46d708c6268f', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KCV50BQ20天幕白', '苏泊尔保温杯', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7b51975e-30d1-4f10-8baa-cdcd630cd129', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KF15A1', '苏泊尔保温提锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('3d6974e5-a945-4c95-bb8f-2fa9396b93be', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KL70-V592', '九阳空气炸锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('72b90d26-aa10-4987-957c-ec3a4d6d7fa6', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KX-30J608', '九阳电烤箱', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8890c865-f005-444b-98f0-b388d383b50d', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KX32-J12', '九阳电烤箱', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a832a4d7-8cd2-439e-8bb6-a0cfc13df029', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'L12-P261', '九阳破壁料理机', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('31a5dc25-51f1-4854-ae81-2567bbf6a8b5', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'L15-P688', '九阳破壁机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('dd9573b6-d41d-4ecb-9228-96957314bff4', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'L18-P132', '九阳破壁料理机', 4, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e7ff300d-ce4b-4d8a-b79e-0ce7aa170f79', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'L18-P161', '九阳破壁料理机', 3, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0c9a6018-8682-4bfb-83d3-7797a6ad77ce', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'L18-Y915S', '九阳破壁料理机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('14595996-3039-41b2-96e0-b81c4bea3a1a', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'L3-LJ150绿', '九阳随行杯果汁机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d3223ea2-2a83-4d46-9af6-1c5537eadd10', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'LKJ28-B', '欧美达煎锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6a3c0bdc-a631-4764-a55e-ad235d73d3b4', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'NJ28PA1', '苏泊尔煎锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e2aeb441-8d52-4005-b6d9-38f67fe87adc', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'RC-T903', '苏泊尔除螨仪', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c3371c49-e610-4585-9310-8f91bf2a4859', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'S20-LA320', '九阳绞肉机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ff017feb-20c1-47e3-86a6-8800d1ab5c65', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'S22-LA309', '九阳绞肉机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('82cb9a98-5f47-4b6c-be6c-2c88f5ac85ad', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SF12FB627', '苏泊尔电饭煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1fb341bc-6260-4b0f-b5aa-b9e7f295b51d', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SF30FD672', '苏泊尔电饭煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('78ecf845-6c99-4ff2-bbdd-b69014854d4a', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SF30HC185', '苏泊尔电饭煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9b4991be-9a62-4c4c-b169-87e8ece920a3', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SF30HC92', '苏泊尔电饭煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b960ba30-9ff0-4dc4-a5ad-374f9ac0dde9', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SF40FC396', '苏泊尔电饭煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ce677e79-4fed-44fd-a116-3e7db698889e', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SF40HC2984', '苏泊尔电饭煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4197f4b7-f5a4-41ad-b2ed-2b471d5e6572', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SF40HC66', '苏泊尔电饭煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5456e433-1c7a-4510-b559-879c06de208a', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SF50FC871', '苏泊尔电饭煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('3d0cc07f-2fb1-40ff-b581-f9c47a9b3030', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SS70Q1', '苏泊尔鸣笛水壶', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b975e6c6-93ae-4a77-aff9-2683ee8ba39e', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'ST16Z1', '苏泊尔奶锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f22edaca-a201-419d-b6d3-50a263d94c3e', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SW-18YJ38', '苏泊尔养生壶', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b01d4ac1-82ed-4eb4-b899-888256fbfaed', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SW-CBJ11', '苏泊尔茶吧机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('3f230725-7e93-4ec7-8ed4-3adcbfa648d9', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SW-CBJ27', '苏泊尔茶吧机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('728eaaee-38d0-4181-84f2-de4417568b20', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SY-50FH79Q', '苏泊尔电压力锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ea82c644-6c80-4352-b192-b4423957e223', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SY-50YC588', '苏泊尔电压力锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5531f597-c166-4ae0-a9d8-37004a9c41f1', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SY-60YC8001Q', '苏泊尔电压力锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('80412c58-5558-4e36-997d-f3e2410129bd', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'TB45Q1', '苏泊尔陶瓷煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ab3ef4f5-7a98-4038-a735-8c5868a9d95b', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'TK1824Q', '苏泊尔刀具', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e7f7973a-371d-4b6d-b0cf-751589209f7e', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'XST-2851', '新思特煎锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('93547f1c-9b37-4310-9d18-cfeefe8ec45e', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'XST-3050', '新思特炒锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('75f123d5-b016-4e4f-906b-790798fbfc09', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'XST-3252L', '新思特炒锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b5120c78-d339-4c91-b275-aaf7631c2678', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'Y-60C20', '九阳电压力煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6a780091-a41b-4b21-a9a1-839a81ed6444', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'YL263H2', '苏泊尔压力锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6bd26ef0-01cb-4fb2-8578-842c328cbb91', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'YL269H2', '苏泊尔压力锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('eef66794-c7f4-4f39-b1e3-39994c43b55a', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'ZN23FC660', '苏泊尔电蒸锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c7b04ee0-b779-4096-98ff-1ceee78e8232', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'ZN23FK930', '苏泊尔电蒸锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a12f1684-be79-4fb3-babc-656e81b01e90', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'ZN30YC827', '苏泊尔电蒸锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('cd3a3823-9c6c-413e-9388-4aa6d1d6e74f', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', '20L白色双核', '百事车载冰箱', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('52483793-19f9-4c96-8149-772b299d1e4b', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'B12-WF503(蓝)', '九阳保温壶', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e2fd3460-fe0f-4955-8394-999f4dd3350d', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'B20LF2S(白)', '九阳保温壶', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8b558652-b460-4a1d-b93b-832c5e3e9494', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'BF4624R832D', '苏泊尔暖菜板', 4, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d667a8b5-3406-4ef0-b945-2de11d0bd28d', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'C22-F7', '九阳电磁炉', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f3e6b108-dc02-42e6-8309-491c2c0d6c5b', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'C22-F9', '九阳电磁炉', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('aad0c8b2-5939-4b6b-9310-706072cbe27e', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'D-10G1', '九阳电炖锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('693ad1dc-f4e6-483c-96e3-139a12ed8275', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DCS-150S02', '九阳商用豆浆机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e4535083-a93c-479d-aa89-59ec8f8a0376', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DG10G-GD102', '九阳电炖锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a77b4039-4a9d-45d8-9b55-c69a2c2106f7', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DG18G-GD185的蒸笼', 'DG18G-GD185的蒸笼', 25, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e993c280-dc1d-4845-be96-b1183d5c3e01', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DG60YC806', '苏泊尔电炖锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('11a60dde-19e4-4b4b-8068-e26eff409db0', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DJ12D-K580', '九阳豆浆机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ed1f020d-91ec-452a-954d-03add78ada0b', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DNF-TH1R', '先锋暖风机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('50d0db8d-6eff-49f7-87f2-b10b37b53dbc', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DOK-K3pro', '先锋欧热快', 4, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('33726457-855a-47c3-8d42-6937392f63df', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DSB450-01', '九阳快捷星商用豆浆机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d5f320be-9a9d-447d-a838-c81f6b014472', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DTJ-T12R', '先锋踢脚线', 10, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8fcf4b33-267d-4254-93c6-8f20e67f29a9', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DU2U3', '苏泊尔超滤净水机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('026af34a-6d64-488e-85fb-e3ded4753381', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DZ110HG-GZ585', '九阳电蒸锅', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e5e0cd1b-e971-45f3-a43d-2d5e30691e68', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'EC32AAN01', '苏泊尔星星石轻铸八角锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6cd2b4f4-7de0-47e8-a6f3-c269206fd07d', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'EES-W61', '苏泊尔剃须刀', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7c5329e7-81c7-4732-bd18-3712c6228e36', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'EJ20LBP01', '苏泊尔煎锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e1e44d6f-696e-4366-a6cd-e2b8c5795e5b', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'F-40TD02', '九阳电饭煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('153395c9-1c79-4609-91bc-409cad0b0587', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'F12FZ-F191', '九阳电饭煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('87eeff16-917e-4882-a12c-abb002fe80f5', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'F30FZ-F4170', '九阳电饭煲', 6, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('cd8bbfef-e868-408d-b3c2-8f71f763799a', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'FW-010196', '飞乐思发热围巾', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4f7330ea-7e50-4b0f-ad6a-4abdc02d31f6', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'FW-011304活力蓝', '飞乐思时尚护膝带', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d19014b3-f5cb-4105-be74-b091379044a9', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'FW-020311天湖绿（M码）', '飞乐思发热马甲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1f87abc8-a3ce-4a41-9a5b-79067de26197', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'G08L', '苏泊尔研磨杯', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('035b2e9f-7880-464c-a76d-89c681fc7480', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'G37', '新功电茶炉', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f10071e4-05d3-456b-ba6d-6cf0506faf04', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'GJ5025S835', '苏泊尔电火锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('49dfa00b-d030-4c6d-83fb-b5580ebfb1a0', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'H2626FK823', '苏泊尔电火锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1677ecdd-54f9-41bf-a8fd-82339c171158', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'H28YK12', '苏泊尔电火锅', 7, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('06bafd0e-554b-455f-974f-184f9400950c', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'HC32A1', '苏泊尔炒锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e6d6e7d7-75ce-4587-a50f-aa4312440028', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'HF2023QT-8', '先锋小太阳', 5, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d38ab48d-c9a3-4e37-ab21-3451f6262173', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'HG10-G588', '九阳涮烤一体机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('67848d00-7da8-4b71-8dca-10e851818df4', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'HG50-G525S', '九阳电火锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c4eaf836-c7bb-4530-92bd-b53e7ab3b212', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'HG60-G1蒸笼', '九阳电火锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('450471d1-5de5-45e3-b7af-fd3b0a2d59cd', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'HG60-G650-B', '九阳电火锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('724afd09-784d-4272-b9b2-6a0549349404', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'HLW-82A-280', '苏泊尔加湿器', 3, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('88e875c4-62d9-463f-bee0-62df700f1db1', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'HN65PS-20', '先锋暖风机', 7, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0120a977-b29a-4d5c-adf7-997839ef1e8e', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JC2828RQ865', '苏泊尔煎烤机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e7086b13-ee55-40b5-8b4f-8e11f9087443', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JK13-GK160', '九阳电饼铛', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b2da426d-e672-4dbe-8b56-b66bc9a703e1', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JK30-GK310', '九阳煎烤机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('aa43a90a-03a5-4b7f-865e-950a40534782', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JK30-GK565Pro', '九阳煎烤机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('20b94194-4ce1-425b-8219-4509bfe7cea2', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JT34RQ17', '苏泊尔煎烤机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6c1226da-be22-409c-af4c-f343020a9314', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JYL-C93T粉', '九阳料理机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9d730555-8801-4bf5-a07a-64c34eb25be8', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JYS-100S02', '九阳营养星商用豆浆机', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('3a82975f-8623-47e4-8d19-0b42a62b1f60', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JYS-170S01', '九阳营养星商用豆浆机', 5, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8bdb38a6-fdf5-4669-afc2-951a3a0147c4', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JYW-R507', '九阳商用净水器', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8f24af9e-ebb5-4aec-9032-05737b613913', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'K06FD-WZ5', '九阳电热水壶', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4cb540e3-f897-4f58-88db-675c32d4990e', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'K15D-WY730', '九阳养生壶', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1322752b-0a28-411e-b320-2aa2fd977569', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'K17FD-W508', '九阳开水煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('31562cf4-f055-435d-a007-b9ac188c9867', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KC115FL10薄荷绿', '苏泊尔便当盒', 10, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('53952838-67cd-4de5-b7d4-824eb2ec9285', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KC20KY10活力白', '苏泊尔保温杯', 4, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('505c5b41-0df0-4393-b106-ef8bb936f567', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KC32FP11奶昔白', '苏泊尔保温杯', 4, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('111e8d18-4be8-4b46-8f19-f895355fcd77', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KC36JH10伯爵黑', '苏泊尔玻璃杯', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5cd7d5db-63be-47a6-9817-7e125b6112c2', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KC43AD5R', '苏泊尔保温杯', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ca2fe6c4-89db-419a-a8c5-1d1c728e0fe1', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KC43HW10晶石黑', '苏泊尔保温杯', 6, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('aeb4f968-3fd4-4af6-8cd0-4ec9b083db0e', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KC43JU10健康燕麦', '苏泊尔玻璃杯', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('03320241-a76a-43c4-86ce-8d4459a46cf5', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KC53CY20红粉猫猫', '苏泊尔BB杯', 12, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a8526574-ee2a-4686-a38d-cfb8cedacac1', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KC53CY20运动狗狗', '苏泊尔BB杯', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4a84ed78-f1c9-4cc2-95ce-2a0f3b70a261', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KC80EP10灰豆绿', '苏泊尔焖烧杯', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b495754e-e7a1-4cee-8387-13dc53f271a4', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KCG28AZ10流光银', '苏泊尔玻璃杯', 8, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0bd45f14-28d2-4327-afeb-b167175017da', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KCG38AZ10流光银', '苏泊尔玻璃杯', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c303b138-a6c8-4526-a4c7-7f68b2b15a3e', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KCG38BD10镜花', '苏泊尔冷水杯', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e52c9655-9b29-4891-a5af-dc0604ed5b81', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KCP10LC20薄雾紫', '苏泊尔塑料杯', 29, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('88c2ca60-9f52-4380-aedb-17f17933f7e6', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KCP85LU10绅士灰', '苏泊尔塑料杯', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('00a56a80-8753-451c-91fe-bc7f3d8a8776', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KCV10AC10宫墙红', '苏泊尔保温壶', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('123d23b0-94ea-4d7f-b9b3-098f2515b2b7', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KCV18BE10法式红', '苏泊尔保温壶', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('88039357-9ff1-4a51-86b2-7f9915cf02e9', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KCV45AZ20星河灰', '苏泊尔保温杯', 4, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1f45bb31-3610-4927-8f90-dfbcfdbaa6b5', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KCV45BC10珍珠白', '苏泊尔保温杯', 19, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4d96557b-bf95-4dcf-9ef0-606410090036', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KCV45DB10夜影黑', '苏泊尔保温杯', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('741fdb9c-b858-4083-abc1-741775761656', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KCV45DB10赤霞红', '苏泊尔保温杯', 6, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e4a37d68-613c-483b-b985-9432276eb53f', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KCV50BQ20天幕白', '苏泊尔保温杯', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a847b7ec-ee34-43db-92d6-bafe15208bf4', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KCV50CR10奶油白', '苏泊尔焖烧杯', 5, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9270b882-a352-4ad1-bd6f-97ef12730ee0', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KCV50DW10天幕白', '苏泊尔保温杯', 7, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e35d5203-c2c2-419a-844c-bf8cb1bf783c', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KCV50DW10晶石黑', '苏泊尔保温杯', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('110befb4-b0c2-43c1-ae89-127549f41d47', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KCV50FB20珍珠白', '苏泊尔保温杯', 82, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1fda2de9-8544-4c51-8272-4ccffaa82a59', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KCV50FB20绅士蓝', '苏泊尔保温杯', 83, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e62405f8-55a9-4d2d-ad2e-d5f2eaa1a3c0', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KCV55DC10暮霭白', '苏泊尔保温杯', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9dd81c58-5d67-4d7b-9e6f-78ae979f94e2', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KCV70BK10春意绿', '苏泊尔保温杯', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('dbcd376b-514d-4640-8ad5-cc00147c72ff', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KCV70BK10棉云粉', '苏泊尔保温杯', 15, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0e7b8f4d-acff-4284-a72a-fa3fdb4258bd', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KF15A1', '苏泊尔保温提锅', 5, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9bec2741-46ce-40d6-b62f-d5e173f90aaf', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KFV17AC10薄荷绿', '苏泊尔保温提锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('45083c17-5b1c-4a0c-a6bd-b033ca0d9cd7', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KGE25CZ10', '苏泊尔抽水器', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('fc89e95d-bf60-4b5b-b139-577fbc79cded', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KJ42D811A', '苏泊尔空气炸锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f0f239c7-8143-4e63-83a6-ae1ae1c08ff8', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'L12-P119', '九阳破壁料理机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('fb41bfc4-899c-40c9-9f88-9e38d1d348e3', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'L12-P155', '九阳破壁料理机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8a6905be-b859-4d1f-8784-e845d8eb8440', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'L12-P261', '九阳破壁料理机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b93628c5-053b-4242-ae9f-6b84d4015375', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'L12-Y951的多功能杯', 'L12-Y951的多功能杯', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('3ed21b21-7496-455b-905e-07c8d7f00a63', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'L18-P132', '九阳破壁料理机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('cb57b08c-418e-4b4e-b309-79fca1ecf302', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'L18-Y915S', '九阳破壁料理机', 3, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d21fd399-05ed-4901-ba8c-6766f967c873', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'L3-LJ150绿', '九阳随行杯果汁机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('58ca5e94-e753-4343-8c46-4feea8e6db79', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'OU-TXW7501晴空白', '欧梵森保温杯', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f4fc26bc-e80e-46ea-bddf-aff44a425e51', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'PJ26W9', '苏泊尔煎锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f6836d88-b941-4d5d-be97-360850c3c992', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'PQ8806', '奔腾剃须刀', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8a384e3c-61de-4bda-9409-abad0bebacf4', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'PW750', '奔腾剃须刀', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('27f31951-1d32-422c-88f5-6ce3e7c02f48', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'S18-LA305', '九阳绞肉机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('645a577d-09a3-424f-a98d-3af3bd457718', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SF20HC0998', '苏泊尔电饭煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7d2ed259-dcb5-44bc-a822-70f4eb60229f', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SF50FC871', '苏泊尔电饭煲', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('2c094888-d875-4ac6-8330-d482082ea092', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SP60S', '苏泊尔破壁料理机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9afc750b-d75d-40aa-9c6d-1fb5222b5f4c', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SP67S', '苏泊尔破壁料理机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0ece7517-c2bc-4cdb-8266-f9ca26b7b7e9', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SPX312R', '苏泊尔破壁机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9339d541-e8e8-4f04-ad96-cc0b95974333', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SW-08C01', '苏泊尔茶艺壶', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('42807db2-c3f6-4dcb-b3fd-6dba2ab00df0', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SW-08S02A', '苏泊尔电水壶', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e1f1b348-0b37-4ac9-88fd-5328605a11e9', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SW-15Y05', '苏泊尔养生壶', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ddc173ca-09e9-45f0-8f78-879b6623b6c3', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SW-15Y22', '苏泊尔养生壶', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9208ae64-5ac4-4e9f-82c0-3e666d7f71fd', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SW-20J101P', '苏泊尔电水壶', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('09797aea-d444-47a0-866c-0efd862d91f1', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SY-50HC8015Q', '苏泊尔电压力锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('60072e63-c011-4846-943a-be10584a6b94', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SY-50YC5015', '苏泊尔电压力锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('180ca921-f3ed-4966-86bf-c39f52721a49', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'SZ30CA1', '苏泊尔蒸锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('93e45ac7-e0e3-4c3a-b704-b00bd57b414e', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'TiCe-34C', '新思特炒锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('25fe4eb1-f9e6-42a7-82ce-baf912965cf7', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'TK21116T1', '苏泊尔保温杯', 8, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4862dfe5-102e-4754-826d-4972a1c0d2ba', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'Y-60C817', '九阳电压力煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e7dfbfd4-7db1-4d38-b4ec-bf526f687a21', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'YW223BA1', '苏泊尔压力锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1b3809b5-b1ca-43cd-affc-1e191ce4f76f', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'ZD30-GE562', '九阳电蒸锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('274f62dd-f486-4180-97a2-e8f29cd3b34c', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'ZN23FK968', '苏泊尔电蒸锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e52e5c71-a7ae-49ca-adda-9f74a0bccc95', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', '40N1S', '九阳电饭煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7340538b-9ea0-44c3-b7be-2ec4c7bb5761', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', '40N1U', '九阳电饭煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('dc5eb741-e281-4c4c-ab20-9b426a1da376', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'B13V-WR528(白)', '九阳保温杯', 51, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8b23ffe7-e7b6-4ba5-9d8e-119063ca6e7d', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'B13V-WR528(绿)', '九阳保温杯', 79, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d0148c15-d883-44e6-93ad-a9d428ffa395', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'B16F-WR188(白)', '九阳白胆保温壶', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('3bcff131-15c0-49af-afb6-8babd45b8b42', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'B52B-WR501(绿)', '九阳焖烧罐', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4b54c65f-3c12-4a5f-9b22-a52911b5ac7f', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'C22S-F51-B4', '九阳电磁炉', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ae810885-58cd-4b3e-897b-3f93dd9c7605', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'C22S-N102-B4', '九阳电磁炉', 2289, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5836ff9a-2af5-4667-83a2-ff3bbcf7f215', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'C22S-N411', '九阳电磁炉', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('55b0e4b7-0930-4f5e-b582-02cb78296fbc', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'CF-CLB2863D', '九阳炒锅', 3, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('74c0d6ca-5b9e-4b62-b285-d6ed66cff16b', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'CF28-CJ311(LB)', '九阳炒锅', 77, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a62ed62b-4c9e-4f04-8d29-876d07a6546d', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DG10G-GD168', '九阳电炖锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d4ca43b6-7c0f-45e3-bf11-443105a4e306', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DG15Z-GD619', '九阳电炖锅', 344, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d9a9e00b-6990-4793-a9e6-e4a66998cb2f', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DG40Z-GD410', '九阳电炖锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5220d2ff-6207-4c5e-bc37-328b5e69e2be', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DJ06X-D2526Pro', '九阳豆浆机', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d8314b28-2ef9-4aea-9d7c-83604e396018', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DJ06X-D4527', '九阳豆浆机', 92, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b1329e8e-7315-4604-936b-3f547a29c711', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DJ10X-D246', '九阳豆浆机', 107, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4e2207f0-fd54-4d20-9a9a-419ce3ba5c18', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DJ13B-D08EC', '九阳豆浆机', 3, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a1e7c619-ac97-4276-855c-ec8e63105fb1', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DZ100HG-GZ105', '九阳电蒸锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('72c203e9-7b52-4b3c-b71c-a6fae0118a13', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DZ100HG-GZ605', '九阳电蒸锅', 456, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7e096e86-1fa9-43ef-9bfe-7c81039b68f0', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DZ118HG-GZ623', '九阳电蒸锅', 31, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('26080541-05e9-4fc7-b6a5-b01c56143b94', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'DZ150HG-GZ616', '九阳电蒸锅', 286, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('39b5261b-9b7f-44f5-be83-2d0d6679252b', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'F-30FY2', '九阳电饭煲', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b893e1fa-ba4b-4a80-b85d-36edea6db419', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'F-30FZ319', '九阳电饭煲', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f04335f5-e045-43c2-aea6-194feeb9eef1', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'F-40FZ820', '九阳电饭煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('41816ff1-62fe-45e9-9819-3b43526fcf74', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'F30FZ-F636', '九阳电饭煲', 219, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('64400973-c3b7-40db-9ec2-2e3e479c5d4f', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'F40FY-F330', '九阳电饭煲', 99, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6e1ddede-9c5b-4ca7-ad7f-724723937b17', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'F40FZ-F5150', '九阳电饭煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4d100bcd-3582-4afb-819c-24ca3e93ce93', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'F50FY-F545', '九阳电饭煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5c5f45af-2eed-4f8d-ac65-e9c67d034a2a', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'HG10-G588', '九阳涮烤一体机', 262, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5c794fd6-af0a-47c3-9877-959b49e667d4', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'HG12-GD76A粉', '九阳电火锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('621d6c39-ab0c-4962-8620-e6a69e3f1b36', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'HG15-G622', '九阳电煮锅', 194, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e1704b73-17c7-4a8f-8c58-217e2a8571aa', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'HG30-G632', '九阳电火锅', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a9492fc6-9f54-4425-8abe-1f9e3497d34b', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'HG60-G650-B', '九阳电火锅', 201, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a7d4b168-4f7c-4697-8ff4-41c70984e193', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'HG80-G811', '九阳电火锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('020c48ec-c06f-494a-b5aa-e96f2b31ddfb', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JK-30K09Pro', '九阳煎烤机', 20, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('fd52d6d5-f6b1-4cd5-9b73-de3bc67e1d51', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JK-30K09X', '九阳煎烤机', 175, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('72586dc4-eaa8-4d82-bd8a-b112799ac611', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JK23-GK655', '九阳煎烤机', 499, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('2ecfe9fa-24f3-45a6-97a7-a512d7894d95', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JK30-GK113', '九阳煎烤机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('11e27d2e-6e28-487c-a306-36bdfd60fb7c', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JYL-C23', '九阳料理机', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('463cda8a-8b92-4ff4-b483-3e96e9b4848f', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JYW-RH550', '九阳台式净饮机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1ea16f19-aef3-4c31-b329-7bb14216f7e2', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'JYW-WS115', '九阳饮水机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('bb8fd933-ae98-4252-b204-d17a7c737b93', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'K15FD-W115', '九阳电水壶', 6, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('917ce68e-7055-4086-a143-b35556db3563', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'K15FD-W123', '九阳开水煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e9fe34c9-c311-495a-a1c8-4819eb0c873a', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'K15FD-W6111', '九阳开水煲', 448, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f677c1fb-fc32-4e3c-a751-6d540e20fc82', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'K17FD-W6310', '九阳开水煲', 505, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f1e13bc1-6eb3-4082-aa1e-f4630ec836f0', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KL30-VF165', '九阳空气炸锅', 260, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('2be5a527-4c3c-4fa8-a5cc-992a02ea1e58', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KL40-V112', '九阳空气炸锅', 78, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('cf12bde2-5cfd-43a3-bd27-187703b5a335', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KL40-VF102', '九阳空气炸锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('041507b4-af16-4d7f-85fb-233e2d32468c', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KL50-V132', '九阳空气炸锅', 246, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6ecd261e-fb18-475f-8853-264716e82ae5', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KL65-V573', '九阳空气炸锅', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5290ab77-7719-4a50-be7f-cfb8392581b7', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KX-30J608', '九阳电烤箱', 293, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9e2f0025-e8c9-4bbf-bd99-f462d978257a', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'KX10-V601', '九阳电烤箱', 152, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('fd095539-1ef0-4f98-bf4f-3647052536a5', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'L18-P631', '九阳破壁料理机', 24, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8543a1bd-3f50-46c6-8e95-87442f930906', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'L18-P660', '九阳破壁机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0988cc58-6a4d-4373-8753-a6fd903c1ad7', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'L4-L971', '九阳料理机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8980e4d7-9db1-4502-be66-359806d33a41', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'L6-L500', '九阳榨汁搅拌机', 268, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c6456b51-6f44-4db2-a4f8-3eca5687ee48', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'S18-LA360', '九阳绞肉机', 221, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ba1b802d-c806-4932-82e3-3d134f1768c5', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'S20-LA906', '九阳绞肉机', 41, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('13e0064b-c870-4e48-bb7b-b2ef1a584644', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'S22-LA908', '九阳绞肉机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('3fc99d64-7a74-49db-9e4d-bd3bd30d58b4', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'S30-LA569', '九阳绞肉机', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('80244e37-10d0-44ae-8ead-135b61f96a73', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'Y-50C31', '九阳电压力煲', 322, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('144a1b2a-a4db-493d-8427-b404d3f822cc', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'Y-50H108', '九阳电压力锅', 274, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('bacbc1d1-e761-4dea-ae04-5d17668d92dd', 'ec64bb4c-cd4b-4c64-96d9-0f5f7738fa21', '首映礼省内仓', 'Y-50H150', '九阳电压力煲', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4e89092f-b86a-4e5a-ae2f-b90da8f2da37', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KF15A1', '高汤宝系列保温提锅1.5L*黑色/KF15A1', 24, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f2556241-5560-47b2-ae14-b5504d98f038', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KF19A1', '高汤宝系列保温提锅1.9L*黑色/KF19A1', 102, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f41b9d9c-72ce-46d2-b168-bcd048a0ad97', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'L3-C61', '九阳随行杯果汁机L3-C61', 29, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('29c6efd8-4e5c-440a-8bad-3b3bf0754c92', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'L18-P631', '九阳破壁料理机L18-P631', 43, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('3a5b28d2-013d-4488-939d-bcab0c87d71b', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'S18-LA360', '九阳绞肉机S18-LA360', 307, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9a2cf891-064b-4b2d-9068-02acaa01b7d4', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KF-1140', '康夫电吹风KF-1140', 27, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f5497ae0-b445-4bb2-a681-2a700ce4b4c1', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'SW-15Y19', '苏泊尔养生壶SW-15Y19', 951, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('090dac43-a1d4-481f-bfdf-aa917c1fa290', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'JT30RQ806', '苏泊尔煎烤机、JT30RQ806', 139, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('740c41b3-824a-474c-899e-4c1c7deb51cd', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'SW-15Y22', '苏泊尔养生壶、SW-15Y22', 304, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('691292f7-cf64-4a72-b7f2-04fcc1e2c33c', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'CFXB40FC59-75', '苏泊尔电饭煲、CFXB40FC59-75', 38, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('effb565c-eacf-4aa9-a47d-08f6e9425b8d', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'C22-IH97S', '苏泊尔电磁炉、C22-IH97S', 120, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9ca9f50e-2257-430f-8dc2-b93110a2bcd5', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'SW-17SJ01', '苏泊尔电水壶、SW-17SJ01', 1013, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0959a0df-0176-4ee8-a282-d0c8c3b3b40c', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'JRTQ20-B175', '苏泊尔绞肉机、JRTQ20-B175', 1355, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('888840ce-8811-4593-b396-f29f04154de7', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCV10AC10岩木黑', '苏泊尔保温壶', 26, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8abbf4ed-6653-4ad8-8dc9-1164ddfb5650', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCV13AC10高山绿', '苏泊尔保温壶、KCV13AC10高山绿', 96, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7351adff-ed9f-4997-8748-7d3b705d646c', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCV13AC10岩木黑', '苏泊尔保温杯、KCV13AC10岩木黑', 15, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('743399ea-8481-47bb-9de3-657278e3726f', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCV16AR50丹泉蓝带茶仓', '苏泊尔保温壶KCV16AR50丹泉蓝带茶仓', 157, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0d036c76-ff42-401e-bc75-9d7fd9b712ef', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCV10AC10天幕白', '苏泊尔保温壶KCV10AC10天幕白', 74, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a50e09fe-05ba-4c5f-a555-d60aee5ca95c', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCV10AC10青草绿', '苏泊尔保温壶KCV10AC10青草绿', 106, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e5ecb5e8-c938-4865-ae6e-b12a57dffc6b', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCV10AV10青绿', '苏泊尔保温壶KCV10AV10青绿', 13, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b2b9d400-ba0f-4667-8256-fc8fec8612bc', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KFV17AD10', '苏泊尔保温提锅KFV17AD10', 36, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c410dacd-6d20-46da-8f0c-5e4bd7dc5713', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCG28AZ10流光银', '苏泊尔玻璃杯、KCG28AZ10流光银', 37, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4fae98ed-5894-40b7-ab51-25881e8c8c95', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCG38AZ10流光银', '苏泊尔玻璃杯、KCG38AZ10流光银', 69, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('489fe96d-27ee-491b-93a8-4ddccb0b9605', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCV45AZ20薄雾粉', '苏泊尔保温杯、KCV45AZ20薄雾粉', 23, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('63259b65-bef6-4280-a05d-30a22605f42a', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCV45AZ20深海蓝', '苏泊尔保温杯、KCV45AZ20深海蓝', 11, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('3d40d2ff-9b2c-4486-a192-4413fb7f4bd7', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCV45AZ20星河灰', '苏泊尔保温杯、KCV45AZ20星河灰', 24, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('71de77ec-0142-42b8-8ed2-b03d05d30fcd', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCV70BK10杏仁白', '苏泊尔保温杯、KCV70BK10杏仁白', 28, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('016a89a9-8fd3-4d37-86fc-c84d2a4875fc', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCV70BK10春意绿', '苏泊尔保温杯、KCV70BK10春意绿', 24, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a2188677-14a3-4fda-a9a1-346c0422fe03', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCV20BV10漫暮黑', '苏泊尔保温壶、KCV20BV10漫暮黑', 17, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('78ff197c-74c5-4ccf-b8b7-66668eaeeed5', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCV15BF50奶油白', '苏泊尔保温壶、KCV15BF50奶油白', 22, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1de09574-361f-43bb-b84c-3024c0cb1856', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCV20BF50奶油白', '苏泊尔保温壶KCV20BF50奶油白', 70, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('36fee64f-65cd-4e99-ac00-7924af7759ea', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCV20BF50烟雨灰', '苏泊尔保温壶KCV20BF50烟雨灰', 52, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b8f037c9-2d95-4a8d-ac3a-7c7b3cd81426', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KC50KL20儒雅黑', '苏泊尔保温杯KC50KL20儒雅黑', 62, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1970b919-a7c3-44eb-a1d0-5f483e8f5d91', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCV50CQ10曜石黑', '苏泊尔保温杯KCV50CQ10曜石黑', 292, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c08f378e-a7e8-42f6-a421-a68497401592', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCV50CQ10科技白', '苏泊尔保温杯KCV50CQ10科技白', 212, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9397b291-8166-4097-875e-7343a90cae12', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCV50DW10天幕白', '苏泊尔保温杯、KCV50DW10天幕白', 194, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0d1e2b80-46ce-4ac1-93aa-1f5f0e1afda6', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCV50DW10晶石黑', '苏泊尔保温杯、KCV50DW10晶石黑', 108, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('790f2b08-8e68-4556-8d4f-f3df779ff1dd', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCV45DB10暖玉白', '苏泊尔保温杯、KCV45DB10暖玉白', 34, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('af539cdf-2141-4278-88f5-18a4b48337c2', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCV45DB10赤霞红', '苏泊尔保温杯、KCV45DB10赤霞红', 78, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7c74d966-77e0-4573-8537-20583cfac70a', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCV45DB10夜影黑', '苏泊尔保温杯、KCV45DB10夜影黑', 72, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('12d9499e-715e-442d-981e-db00bdcf15b6', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCV55DC10暮霭白', '苏泊尔保温杯、KCV55DC10暮霭白', 40, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('34aa6dc5-1dd5-43c0-b076-6da82d672517', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCV50FB20绅士蓝', '苏泊尔保温杯、KCV50FB20绅士蓝', 2152, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a539083b-ea2b-40dc-bdc6-c0a751012e54', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCV50FB20珍珠白', '苏泊尔保温杯、KCV50FB20珍珠白', 2399, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('03c25357-9142-46a9-9b83-4aa4b8cc4e04', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KF25A1', '高汤宝系列保温提锅2.5L*黑色/KF25A1', 16, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c7b503b0-2ae0-49b1-b0ed-f845b2c69a51', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'TK1916T', '苏泊尔套刀TK1916T', 17, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('fb8ebc55-dc9a-42cf-9365-812cd3ee0851', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'TK1927K', '苏泊尔利刃系列刀具五件套TK1927K', 26, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('13874b05-64cb-4f4c-a30c-127d788faa86', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KC20FZ50闪耀黑', '苏泊尔保温壶KC20FZ50闪耀黑', 24, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d60ebd48-4e51-4861-b544-790ee21abe25', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KC43HW10晶石黑', '苏泊尔保温杯KC43HW10晶石黑', 21, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c6ea914c-e229-41bf-9d5c-ab4ed0029c69', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KC43HW10晶石白', '苏泊尔保温杯KC43HW10晶石白', 15, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('cb36c24f-5358-4ef2-95fa-635e23d8966a', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KC50HY30水墨绿', '苏泊尔保温杯KC50HY30水墨绿', 97, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('09d6a4f9-a8bb-4e9d-9b63-f54a81d933a8', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KC50HY30深海蓝', '苏泊尔保温杯KC50HY30深海蓝', 62, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9ff9a624-e99f-4344-b92b-bc6e9703c710', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'TK21116T1', '苏泊尔保温杯套装TK21116T1', 903, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8bceaeff-13c0-42a9-9450-a3cda017241d', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KC45KR10羊皮纸', '苏泊尔保温杯KC45KR10羊皮纸', 105, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('af4b8c15-5bd5-4f74-bb09-f19040787d1d', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KC25KS10', '苏泊尔旅行壶 KC25KS10', 28, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6a505224-1e35-4fdb-bfb7-282ce148729f', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KC80KT10杏花蜜', '苏泊尔焖烧杯KC80KT10杏花蜜', 21, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('52839dd2-4b97-4272-b2ec-bb91fd00bed1', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KC80KT10燕麦奶', '苏泊尔焖烧杯KC80KT10燕麦奶', 12, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7b1e9c01-dd4d-42e4-ab66-696b5bd843ee', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KC50KJ20儒雅黑', '苏泊尔保温杯、KC50KJ20儒雅黑', 87, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d6becb7c-ee34-464d-bdad-ed5f8c76f630', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KC50KJ20雪峰白', '苏泊尔保温杯、KC50KJ20雪峰白', 12, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('3cc5c900-d634-4556-b129-c3e930be8191', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KC20KH52罗勒绿', '苏泊尔保温壶KC20KH52罗勒绿', 224, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('bfff7b72-66f5-4fad-93ee-1253f0d7e834', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'TKC200KH53', '苏泊尔保温壶TKC200KH53', 66, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('bcdcb7cd-d4a0-4dd1-b16c-761dd2e31c57', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'JK-30K09X', '九阳煎烤机、JK-30K09X', 54, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ba56bdf7-3841-48f2-bba9-d554c28a21a5', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KX10-V601', '九阳电烤箱、KX10-V601', 70, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a758cf03-94df-4b75-9455-67e5265c88aa', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'F30FZ-F636', '九阳电饭煲F30FZ-F636', 13, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e3ed4a2b-9c7c-405c-a786-321b93c1a67f', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KL30-VF165', '九阳空气炸锅KL30-VF165', 32, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e50f8526-ed3b-4ae7-9267-e82375787fec', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'K17FD-W6310', '九阳开水煲K17FD-W6310', 29, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('463f3f5a-b61d-4ffb-ac77-98dd43f166bc', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'F40FY-F330', '九阳电饭煲F40FY-F330', 3, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4e0fbdee-4f92-4c53-895c-0e6aa26f2ca5', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'HG15-G622', '九阳电火锅、HG15-G622', 70, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ca468c82-5c96-464c-b58c-ac8dfde8414d', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'HG60-G650-B', '九阳电火锅、HG60-G650-B（新款）', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('23d9f606-9228-4181-95ef-88da9b609841', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'JK23-GK655', '九阳煎烤机', 4, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c208a622-6e04-452f-ad20-a9286952ad3a', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'Y-50C31', '九阳电压力锅Y-50C31', 66, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a0ec4d2d-aa90-4111-a68a-745b8d0f4496', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'Y-50H108', '九阳电压力煲、Y-50H108', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('af182f99-3518-4f56-9942-f5b3b9ab921e', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'K15FD-W6111', '九阳开水煲K15FD-W6111', 181, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5b2ffeb1-9ae2-490e-a649-25f446e9fb2e', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'DZ100HG-GZ605', '九阳电蒸锅DZ100HG-GZ605', 25, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('dbe468e5-cf6e-4ec5-b8e3-1d6c4a557d0b', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'C22S-N102-B4', '九阳电磁炉C22S-N102-B4', 360, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('77acb3f4-721d-4328-99cf-7536671e4d59', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KL50-V132', '九阳空气炸锅KL50-V132', 113, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7e88d2c8-dfda-4545-a852-48aeca4584a5', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'K17FD-W6318', '九阳开水煲、K17FD-W6318', 39, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4e1d08f4-5f16-41d6-9d14-0dbe115b1dfb', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'HG10-G588', '九阳烤涮一体机、HG10-G588', 18, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f89b0661-b667-4939-afeb-7514240e15aa', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'CF28-CJ311(LB)', '九阳套装锅、CF28-CJ311(LB)', 21, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('43b36173-f051-4878-8a09-a0ab6da764d3', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KJ35D701', '苏泊尔空气炸锅KJ35D701', 173, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('bdc2db97-f43b-4d3b-ba9b-9f7c5eb71dbc', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'SW-15E02A', '苏泊尔电水壶、SW-15E02A', 23, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('744e85c9-b9bc-4c4c-bdc7-5a949ab27c17', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'DP-P1003', '大卫平板拖DP-P1003', 278, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9330b6c9-5c06-4b46-8f77-16f2eb631a53', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'DP-P1206', '大卫平板拖DP-P1206', 86, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('92f1c1ef-b75d-42b1-a2be-2576d2f42195', '1397cc82-bf0a-4b07-9092-29f1a760b265', '广东云海仓库', 'KCV10AE20海滨蓝', '苏泊尔保温壶', 41, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4943ddd2-a0dc-4f7a-b0c4-ae1a6c33c0ba', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'SF40FC896', '苏泊尔 SF40FC896', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d9354806-ac2b-4007-ad45-97fea33fe324', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KC45KM10薄荷绿', '苏泊尔 KC45KM10薄荷绿', 1967, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ad0daf5e-5113-4356-bada-67590081386e', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KC45KR10 羊皮纸色', '苏泊尔 KC45KR10 羊皮纸色', 594, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6c489c4f-ed4f-45a1-a08c-8ca6e472e61c', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'VC32BH01', '苏泊尔 VC32BH01', 679, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b2147e73-a0cc-44be-b9c4-b43d11c85952', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCG145AF50奶咖', '苏泊尔 KCG145AF50奶咖', 106, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('23d2a046-8732-423a-bdc6-004a5f44ec29', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'JT30A20', '苏泊尔 JT30A20', 98, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c8547af8-5786-4c54-a01a-83ba41ec889b', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KC50KL20儒雅黑', '苏泊尔 KC50KL20儒雅黑', 26, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e6a83ade-2dd7-4c7f-8d9e-a0a2b87aba40', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KG01C1', '苏泊尔 KG01C1', 611, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b2706a60-ea9e-4fbc-9b71-33293e86a275', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'Z382822AD1', '苏泊尔 Z382822AD1', 1809, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d7fa3c7c-da21-4454-ac3c-a170d2028248', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'VZ26BS05', '苏泊尔 VZ26BS05', 50, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8b8f57f2-6407-4576-8acd-a8d4142f3d2c', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'VT16HS02', '苏泊尔 VT16HS02', 272, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d8c552ab-5cb5-4f72-8c77-bddca18472b6', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV10AC10绿', '苏泊尔 KCV10AC10绿', 78, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('eb7e5d1a-d68a-4206-8aa0-32df94c0d974', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'TK2185T', '苏泊尔 TK2185T', 3, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('01798d0a-4c63-4c72-a584-608f583ccb92', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'SW-15YJ02', '苏泊尔 SW-15YJ02', 828, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b6082203-7c7c-49dc-91ef-7bbfb222b76e', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'EGH-923B', '苏泊尔 EGH-923B', 63, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ad749014-f539-44f5-b2a2-0b146a276e8f', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KC43JU10酸甜草莓', '苏泊尔 KC43JU10酸甜草莓', 37, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0ad2268a-89c0-48a7-88dc-e7bcb60f8c9d', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'SF40FC0063', '苏泊尔 SF40FC0063', 20, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1f470e32-f9a9-464c-9d97-15017a168bd4', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'JRD07', '苏泊尔 JRD07', 140, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('953cef68-539e-4b51-9c80-4edd0061b871', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KG05A1', '苏泊尔 KG05A1', 214, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0d0e36ef-ef2f-4b88-99b8-cfd30e1cd2b1', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'TK23004W', '苏泊尔 TK23004W', 4, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('990cb937-6c74-4aa0-9bef-391ec4a5ff47', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'SY-50YC505Q', '苏泊尔 SY-50YC505Q', 51, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('efcb9e2f-25b9-442c-831e-8b0ece1f1f22', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCP10LD20', '苏泊尔 KCP10LD20', 66, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('52473363-0351-4841-99a3-fe873bc5896d', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCG28AZ10', '苏泊尔 KCG28AZ10', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f3017b90-82c4-4a81-b71b-4f82290e5e04', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV40AG10摩卡黑', '苏泊尔 KCV40AG10摩卡黑', 126, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('223b7bc4-530b-41ff-9f40-a3350f6347d4', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'GT70AX-12', '苏泊尔 GT70AX-12', 44, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c4d6b201-7853-4865-a56b-da15984f65c1', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'VJ26PAN01', '苏泊尔 VJ26PAN01', 69, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1c83b653-7189-41c2-bb18-94cd5b9ef303', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'JR05-300', '苏泊尔 JR05-300', 57, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c0820bef-4b46-45c3-a7e4-0ba01f5e8ec3', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KC45HU10摩卡棕', '苏泊尔 KC45HU10摩卡棕', 180, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d4162db0-8e9d-41f5-84eb-07bca1d513e5', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCP10LD20', '苏泊尔 KCP10LD20', 56, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a6a02789-935f-4b9e-9001-16c8839a1153', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV40AG10杏仁白', '苏泊尔 KCV40AG10杏仁白', 10, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0096e8f7-4163-40c9-91bd-3fa46bf1d6ef', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'PJ28R4', '苏泊尔 PJ28R4', 12, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4ec1efcc-5e69-47f3-9721-f12066bb0f26', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KJ30D837', '苏泊尔 KJ30D837', 107, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8c2c47b6-7b7d-4ec9-a2e8-e8aae9e5b442', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCP10LC20', '苏泊尔 KCP10LC20', 142, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4ee32cb6-c201-413e-bcb3-e869abce403b', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KD60D79', '苏泊尔 KD60D79', 64, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('929f0bb0-21a3-43bb-b2cc-bf7228414d02', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'C22-IH83E', '苏泊尔 C22-IH83E', 803, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5a6307e1-37dd-4980-9b5b-d95373e90b63', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'SW-17SJ01', '苏泊尔 SW-17SJ01', 772, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7ee5669a-e7cf-4f33-9dbc-5048995bab97', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KC50HY30水墨绿', '苏泊尔 KC50HY30水墨绿', 34, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e460be07-4972-4879-87c7-80ab553d142b', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KC43JU10健康燕麦', '苏泊尔 KC43JU10健康燕麦', 123, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5af85dc3-bd01-42c0-8ea5-453dc001047e', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'VC32SP05', '苏泊尔 VC32SP05', 53, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('01fb604e-7bc3-4b7a-b539-a0e5e142b6f0', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCP10LC20', '苏泊尔 KCP10LC20', 135, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('955ba3a0-1a55-4f95-b22b-84fdeaa84443', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'SF30FC996', '苏泊尔 SF30FC996', 57, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0fcacf95-3dcb-4d48-a606-461684283b76', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV10AC10岩木黑', '苏泊尔 KCV10AC10岩木黑', 26, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4184cc9e-a055-4471-9a46-2bdc592b5818', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'ELS-310B3', '苏泊尔 ELS-310B3', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a912a5e7-31ec-4664-bbfb-3e73489b71f8', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV20AK10珍珠白', '苏泊尔 KCV20AK10珍珠白', 304, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('bc1d0719-ac3d-4ec3-9363-cb868591f355', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'EJ30HAN01', '苏泊尔 EJ30HAN01', 119, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('14d6cc61-10ee-4547-99f3-e3c378550e57', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'HW-PC81A-15', '苏泊尔 HW-PC81A-15', 13, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('803dfef1-d6ba-4bf4-8f6c-81d02cd3f970', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV45AZ20薄雾粉', '苏泊尔 KCV45AZ20薄雾粉', 17, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('68a8eeae-82da-42d0-b8de-0ac87467bdae', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV45AZ20星河灰', '苏泊尔 KCV45AZ20星河灰', 5, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4f5e8758-cd92-4f75-ad52-4deb822db194', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV48BW10酷乐银', '苏泊尔 KCV48BW10酷乐银', 48, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0d1a5a10-e0d4-4e34-a111-271adfbfd1aa', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'JD3424D808', '苏泊尔 JD3424D808', 14, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('313010fe-525a-48a8-bf2f-734934570227', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KT01C2', '苏泊尔 KT01C2', 62, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('90387bf8-3647-48ab-8f4e-cbdef2c8f4b2', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'JJ30A648-Q', '苏泊尔 JJ30A648-Q', 10, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0ba4756b-ad02-43bb-8493-5af0ec65a8bc', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KC50HY30深海蓝', '苏泊尔 KC50HY30深海蓝', 50, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('620a3aa3-99c5-4af6-a095-84b9274eb168', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'EZ26BS05', '苏泊尔 EZ26BS05', 31, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('92ed6d6a-7b0e-4678-8c6e-1ac9a5c0e263', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'ZN23FK930', '苏泊尔 ZN23FK930', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('61977c8d-ce67-40e2-9260-b803f5d28176', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'TK1610Q', '苏泊尔 TK1610Q', 39, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('947a9d29-e801-4f88-add3-3b51032ad1a4', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'SY-50YC8186', '苏泊尔 SY-50YC8186', 68, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e6739ddc-738e-4586-bff5-0794a43cc469', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'SY-50FC03Q', '苏泊尔 SY-50FC03Q', 118, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6f30bf6e-b32a-4060-9d20-dfd66531416c', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'VT20QF01', '苏泊尔 VT20QF01', 77, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('66562d9a-2b82-4dfe-9808-6a5d88b3b919', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'SF20HC949A', '苏泊尔 SF20HC949A', 12, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d0c43d1c-e0bc-43f0-bb66-826cfef86294', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KC36JH10 黑色', '苏泊尔 KC36JH10 黑色', 9, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('29a1f3d2-f3e5-4cb1-87a4-aab5992254d2', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCG145AG50翡绿', '苏泊尔 KCG145AG50翡绿', 66, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('09552b2c-766a-4457-92aa-2a522caeed24', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'JT30AQ107', '苏泊尔 JT30AQ107', 21, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('74cecb01-66b2-4b0a-96d6-e1f8d575172b', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'SHC-L91A-22', '苏泊尔 SHC-L91A-22', 4, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7e40cebf-3c80-4ac4-af11-49919410b3f8', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV43AP10', '苏泊尔 KCV43AP10', 18, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5e148132-a9d2-4e22-8875-a1c0d036865b', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV10AC10白', '苏泊尔 KCV10AC10白', 91, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7c216173-0bd9-4f6a-8b66-44677b8593ad', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'VTP2405T', '苏泊尔 VTP2405T', 20, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d72698e1-be59-493f-a2fc-e847f46d3693', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'EHJ34AAP1', '苏泊尔 EHJ34AAP1', 69, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b034a4f7-2805-40e0-ab0e-ea9a2b847a65', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'SW-15Y02', '苏泊尔 SW-15Y02', 377, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a19d5af7-4c3a-464a-9bf1-65b8fb006382', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'H12YK29', '苏泊尔 H12YK29', 97, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1e872c95-6f11-4165-9ab3-1d7d4e13428a', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'VC32RF01', '苏泊尔 VC32RF01', 38, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0915584f-ea5a-424d-ab60-69157178ce8e', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KC38FP10', '苏泊尔 KC38FP10', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b0f2ca3b-2f0c-44b1-8530-1f19c6be0b5d', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KGF22AD10', '苏泊尔 KGF22AD10', 38, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e32d356c-cc29-4b75-b6aa-6384ba92fb7c', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'DG15YC885', '苏泊尔 DG15YC885', 39, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ebba9a96-55f0-4eee-a17f-ef5232650464', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'SC05A-45', '苏泊尔 SC05A-45', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('40467843-4203-4d63-988a-5085c30cf1ae', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCG145AF50 翡绿', '苏泊尔 KCG145AF50 翡绿', 29, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('3ce1af3e-5ce5-4ec3-a90a-ce304422d833', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'ES-RT31', '苏泊尔 ES-RT31', 17, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0ad83a76-23bb-4df1-aacd-90fb599935b8', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'JR52-U', '苏泊尔 JR52-U', 29, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('81468032-6f75-413a-885c-b2af52d0f1d6', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV70BK10春意绿', '苏泊尔 KCV70BK10春意绿', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b2f9991b-af7f-43e9-a0bf-87853b4408ff', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KC15KY10奶油黄', '苏泊尔 KC15KY10奶油黄', 34, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f8434cd0-d1ac-45ac-82bf-f86c102ea09d', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV68BG10杏仁白', '苏泊尔 KCV68BG10杏仁白', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('09d9f5f9-1d4b-4c04-b9c3-57e6e7caddb8', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV48BW10摩登红', '苏泊尔 KCV48BW10摩登红', 21, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6d1155c8-0f19-4627-a08d-64b73a6d9f15', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'SF20FC45', '苏泊尔 SF20FC45', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d9839bca-afcc-4d0a-a18c-9f6e7fb699ea', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'YL223H2', '苏泊尔 YL223H2', 20, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('51691346-2a1e-4960-adec-b0768589100a', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'H20YK840A', '苏泊尔 H20YK840A', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('394e4768-751c-4c0f-85da-52d1d27808f4', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'H30YK17Y', '苏泊尔 H30YK17Y', 6, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('535e7efe-776a-4b67-b455-39bcc88ad8cc', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'SF40FC71', '苏泊尔 SF40FC71', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0cf30886-06a9-4842-b781-3a25106bba3d', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV55AL20森林玩乐行', '苏泊尔 KCV55AL20森林玩乐行', 12, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a466e5e4-0ed6-431d-8087-c42e5c3f8241', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KJ50D67', '苏泊尔 KJ50D67', 73, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7a364950-debe-43b6-b9e7-c1153fca7e23', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV70BK10杏仁白', '苏泊尔 KCV70BK10杏仁白', 3, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('89f806f7-5c84-4397-b1e6-ad6737225bf3', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'C22-IH91', '苏泊尔 C22-IH91', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('39f654b7-4822-4aca-a4f6-4e2db9c22c5d', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'VCM05S', '苏泊尔 VCM05S', 14, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('94f3e0b8-b4a1-4924-8918-7354a162b907', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'VC30JAC01', '苏泊尔 VC30JAC01', 55, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4f5025ff-6f84-4dac-91cf-bb6866ac7581', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV55AL20彩虹音乐会', '苏泊尔 KCV55AL20彩虹音乐会', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('bc6abd4e-d373-4c8d-b7dc-33fde2466e71', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'YW22L1', '苏泊尔 YW22L1', 34, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c1f4b43e-1f0e-4242-a8e1-12b1120a4cba', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'VZ26BS03', '苏泊尔 VZ26BS03', 27, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9c80d85f-13bc-4bbe-8346-1e08346f4614', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCG145AG50象白', '苏泊尔 KCG145AG50象白', 9, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8bec11c5-7b2b-4a16-864d-99cd4db02c79', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV55AL20精灵露营趴', '苏泊尔 KCV55AL20精灵露营趴', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('cac1551f-32f6-47f0-a896-291a18111d8e', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KC20KY10活力白', '苏泊尔 KC20KY10活力白', 14, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('86576fb5-a344-445d-aae8-183b17587b71', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KC53CY20', '苏泊尔 KC53CY20', 24, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9b0ec610-4477-4682-8f5a-b2e96efb57f1', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCP10LC20', '苏泊尔 KCP10LC20', 25, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4eeee7ca-e473-49ad-b446-2e046eaf0d3c', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KGF20AH10', '苏泊尔 KGF20AH10', 32, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('bbb991db-669b-4625-abe5-8f30c6a16ccf', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCG145AF50 象白', '苏泊尔 KCG145AF50 象白', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('585443d4-fd9c-48cc-b097-5a03895d101e', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'ST22H1', '苏泊尔 ST22H1', 41, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7d2907e2-7c1c-4863-80f4-fbd16d081e9d', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'ST20H3', '苏泊尔 ST20H3', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0c348d50-5e6e-4336-beb1-70cd96bd50de', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'TB35UA1', '苏泊尔 TB35UA1', 23, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d6d50e03-176c-42fe-89c9-5ec0a16dca2e', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV50AB10极光黑', '苏泊尔 KCV50AB10极光黑', 12, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1b0d279f-3db2-41b1-a47b-ee369f5aa8ac', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'YW223JA1', '苏泊尔 YW223JA1', 64, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7bb5c445-ff9a-4407-82f5-a59b555a6409', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'SW-17T12C', '苏泊尔 SW-17T12C', 54, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e6c73e99-2250-4a0f-bc89-ca0a47444019', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KC53CY20', '苏泊尔 KC53CY20', 13, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5d8df32c-45b5-44f9-b380-daa73cb11ecf', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'GH-200C', '苏泊尔 GH-200C', 24, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a68841dd-d1dc-4d9b-bfac-3dd061fde302', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'TK21111T', '苏泊尔 TK21111T', 18, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('faad80ad-12e2-418c-88e0-bc7405a24073', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCP10LC20', '苏泊尔 KCP10LC20', 5, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d65f6a57-11a6-4dfd-b1fc-14b67caf57bd', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'TP2106E', '苏泊尔 TP2106E', 3, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('137a5113-b139-4f85-8dc2-a8cd0d6f53f6', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'SP67S', '苏泊尔 SP67S', 16, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ee6cc75f-30d7-4f78-a0d7-ecab19191e96', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'ET24MF01-BA', '苏泊尔 ET24MF01-BA', 5, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1096703c-dcf6-443b-b3cd-0419d62679d7', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KC45KR10 摩登红', '苏泊尔 KC45KR10 摩登红', 6, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a3743b9d-5797-459f-abf9-a0306a5f8fde', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KC45KM10奶油白', '苏泊尔 KC45KM10奶油白', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('87ad03eb-ead2-4309-aa19-d7c4c039a373', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV50AB10日光白', '苏泊尔 KCV50AB10日光白', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('68f7c6fa-66b6-4a23-9c36-a1d1b98d5974', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KC45HT10奶油粉', '苏泊尔 KC45HT10奶油粉', 13, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('20fe9ac3-9949-4ff3-97b1-490a74099e81', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'TB45UA1', '苏泊尔 TB45UA1', 88, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('60eef75a-d026-4aad-b493-4f9c1a1c2b60', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'C22-IH97S', '苏泊尔 C22-IH97S', 33, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a4e00130-387d-42cd-b93d-b794de92d4c2', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'JRD05-U', '苏泊尔 JRD05-U', 23, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6da7ffc0-9003-4f9d-8b2f-ee32404091bc', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KC45HU10 奶油粉', '苏泊尔 KC45HU10 奶油粉', 3, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('426abf68-73a3-44b4-856c-d85b027d52f6', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV20BV10漫暮黑', '苏泊尔 KCV20BV10漫暮黑', 68, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7e330546-056e-4f46-8970-7121da6c9606', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV20BV10高山绿', '苏泊尔 KCV20BV10高山绿', 12, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a3a05feb-c067-4143-9974-17491f4517f0', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'T0934T', '苏泊尔 T0934T', 4, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('cb756405-0c78-427c-862e-8830d73d5ba6', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'TB45A1', '苏泊尔 TB45A1', 50, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0ce19fd4-2d08-40d5-9a63-d83f23e81b99', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'JP93Q-1000', '苏泊尔 JP93Q-1000', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('01008313-c286-4af8-9734-e9df32a748a7', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'VT22WAS01', '苏泊尔 VT22WAS01', 22, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c44778a9-6066-4fee-bcc9-0aafa66a5041', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KF15A1', '苏泊尔 KF15A1', 8, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('25db82ec-f55d-487e-a326-99bf4f0e4416', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'TKC200KH54', '苏泊尔 TKC200KH54', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('50e3dbb1-25e5-4398-a7b2-d992159c30e3', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCP10LC20', '苏泊尔 KCP10LC20', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('acc5dec6-b3af-4d1d-bd9b-3a89edacb88a', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'VTP1605T', '苏泊尔 VTP1605T', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('48f32f3b-591b-4e7d-a8dc-8cd5d1934d68', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'SY-50YC16', '苏泊尔 SY-50YC16', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('85bc6c57-acc7-43dd-b322-228a22b422b3', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'SY-50FH77Q', '苏泊尔 SY-50FH77Q', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('70eb3a2e-f546-4bfc-ac54-f560e054d430', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'CC30JG3', '苏泊尔 CC30JG3', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5fe7b884-fed1-40b4-af0f-c34154951e47', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'JD30AQ101', '苏泊尔 JD30AQ101', 3, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4e1899a9-070b-4295-8559-472949d3b68b', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'SY-50FH76Q', '苏泊尔 SY-50FH76Q', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ad76fd25-f57f-4421-a975-6f35d2fb4327', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'ST24H1', '苏泊尔 ST24H1', 6, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d19eef3e-f994-4add-9ad4-7624e0dbb529', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KJ520G-E09', '苏泊尔 KJ520G-E09', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7e89d08b-cba3-4c68-af03-da53b40b27c1', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KJ420G-X03', '苏泊尔 KJ420G-X03', 2, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5bb34048-2d49-4d2e-ae69-7a81db3dcf96', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'ST18H1', '苏泊尔 ST18H1', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('876a2c60-3d0d-48ea-9423-f3c50cc8c443', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'H24YK11-120', '苏泊尔 H24YK11-120', 6, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('27194632-bafe-4737-9efc-88e84ebfdb1e', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'T0933T', '苏泊尔 T0933T', 3, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('2e8ce2f3-f3e9-4f80-923f-90890f43e2f9', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'TP1627E', '苏泊尔 TP1627E', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ad391a1f-ce44-4758-bfda-a8e43156a37a', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'IM05-220', '苏泊尔 IM05-220', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('38e1832c-7edc-41dc-ad9c-94667e95a658', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'ID19-220', '苏泊尔 ID19-220', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('36c54a96-a0c3-43b2-91ad-f6ff47c5bf90', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'JS30-230', '苏泊尔 JS30-230', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('754058c8-5c2c-4d92-83b1-a3af3dfa28a9', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'SDHCB11T-210', '苏泊尔 SDHCB11T-210', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('32cbeaf4-c413-4b17-966b-a3e1f55ba64d', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'ES-RT31', '苏泊尔 ES-RT31', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d01fb997-3776-41cc-be6c-88a18936c763', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'TK23018E', '苏泊尔 TK23018E', 8714, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('222a9e4d-dc65-4477-bdf4-477fa1016881', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KG20AK10', '苏泊尔 KG20AK10', 5031, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('83365f95-5b89-499b-b786-00193c93a19e', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV50BA20薄荷绿', '苏泊尔 KCV50BA20薄荷绿', 88, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ad62dbb7-2ef4-47a0-8d96-dc7b0de34c35', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KC10LA20运动黑', '苏泊尔 KC10LA20运动黑', 840, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('af266395-f03c-4bcb-bcb2-df327e07e191', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV50BA20儒雅黑', '苏泊尔 KCV50BA20儒雅黑', 50, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1f6e9e08-15cd-45dc-84af-30b7bb5eab3d', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KC10LA20觉醒橙', '苏泊尔 KC10LA20觉醒橙', 3, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7d389bef-1612-4815-a543-587076d9c49e', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV50BA20优雅白', '苏泊尔 KCV50BA20优雅白', 84, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('2a29a70e-72d0-456a-9bb7-3d4de44b32cc', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV10DP50', '苏泊尔 KCV10DP50', 1714, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('87f78409-e4a7-482d-87d9-908e5d91de1f', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'TK23104E罗勒青', '苏泊尔 TK23104E罗勒青', 603, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('591baf0f-cfa5-4126-964e-d98a70c652db', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'W402825AB1', '苏泊尔 W402825AB1', 143, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('acaf8309-df83-48d2-b8f4-f488b7d690d2', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KGF18CG10', '苏泊尔 KGF18CG10', 1367, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c1acb510-45c1-4173-8b6c-31cd4001b473', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KC38GB10/儒雅黑', '苏泊尔 KC38GB10/儒雅黑', 374, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('2b4b6c6c-0bba-4de7-ac49-c8a0cc5b8ea4', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KGF95BW10', '苏泊尔 KGF95BW10', 2100, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('03b6a312-e523-4a7b-8b26-c343fc7b704c', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'TK23024E', '苏泊尔 TK23024E', 973, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b63c20e2-df42-456c-86cf-3ce9c02b8ec5', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV70AF10/曜石黑', '苏泊尔 KCV70AF10/曜石黑', 295, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('101b48ff-35d1-43e1-8bf3-0d45102c3858', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KFS13AD10冬枣青', '苏泊尔 KFS13AD10冬枣青', 1695, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('04313c87-6c44-4bab-881a-4cb607754c6a', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KC40JA10', '苏泊尔 KC40JA10', 188, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d920bd3c-bbe1-4d57-88cc-389c32bd1dcc', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'C22-CS60', '苏泊尔 C22-CS60', 135, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5d8cb988-e3d9-4fac-b3fe-c079f938e914', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'JT34A820', '苏泊尔 JT34A820', 45, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ed185dea-c45b-4ba1-9f4f-50eed99a971c', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'Z16YK858', '苏泊尔 Z16YK858', 120, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e2b2aa7b-af42-4c88-94d0-93699cab5ffa', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KDB10AH10', '苏泊尔 KDB10AH10', 165, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('742785be-8d0e-476c-ad96-66e8ada980a6', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'SY-50YC4186', '苏泊尔 SY-50YC4186', 277, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('94baeb18-0d3c-47fa-a75d-d8b9f7183f4c', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCP56LW10茱萸粉', '苏泊尔 KCP56LW10茱萸粉', 142, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f6d228ad-3184-48db-bcb0-ad8628993af4', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'ZN23FC857', '苏泊尔 ZN23FC857', 24, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('660a73dc-3b63-46d4-91d7-8d58f0e8db89', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KFV17AC10薄荷绿', '苏泊尔 KFV17AC10薄荷绿', 22, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e0bc491a-35f1-46e7-8278-9335cd3a1b51', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'JJ30A69', '苏泊尔 JJ30A69', 51, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('580d52ad-ce0f-4acc-9775-fb49acf249dc', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'TK23104E藜麦咖', '苏泊尔 TK23104E藜麦咖', 1088, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('03dcbf34-d11a-4bf4-a00a-c0fa4dbbe592', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KFV17AC10莲子白', '苏泊尔 KFV17AC10莲子白', 77, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8e515041-98ef-44d7-af18-427caed375f1', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'H20YC841', '苏泊尔 H20YC841', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('dcf28a6f-d6a7-4a09-829f-1be7aa0bb31e', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'SF30HC0028', '苏泊尔 SF30HC0028', 121, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c29707ef-0335-43c8-b362-4e37d3d84f25', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'JD32AQ18', '苏泊尔 JD32AQ18', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a27a4b6e-ff7c-4c0c-9ec4-3f3ce6a324ff', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KGF25BK30', '苏泊尔 KGF25BK30', 233, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e05e2387-83bf-4018-b2f8-b361226bad77', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'SW-15YJ55', '苏泊尔 SW-15YJ55', 5, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c3ef95be-23d5-4e74-a660-9c9d4cf12ed1', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KFS13AD10生酪咖', '苏泊尔 KFS13AD10生酪咖', 1099, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('cabc1f0c-9670-49b4-9269-cd898328d9ee', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KT01AH10', '苏泊尔 KT01AH10', 34, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('be9c54f8-6a14-4d1d-8d00-26cf1e4f9774', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'ET22ALAF01', '苏泊尔 ET22ALAF01', 14, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ab21da8e-9c27-401f-8407-1d5261887dd8', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCP60LM20芝士黄油小熊', '苏泊尔 KCP60LM20芝士黄油小熊', 141, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e1c90162-ae0a-4e8f-958e-43e0df6a7823', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KGF06CV10', '苏泊尔 KGF06CV10', 22, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('199f2150-1aef-4863-9677-6f3509530301', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KJ50DQ75', '苏泊尔 KJ50DQ75', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('3e718d69-1f17-4960-96d5-d7f4f6132ce4', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'HC30YT1', '苏泊尔 HC30YT1', 82, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('fb553991-f740-415e-9737-3dd3b94d37e9', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'HC32YT1', '苏泊尔 HC32YT1', 174, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9d25be1e-929d-4973-a138-0c05f6af821d', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KG02C1', '苏泊尔 KG02C1', 122, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0fcae61d-31cf-4f3e-9cff-1ac8931f7ca3', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'SW-15Y23', '苏泊尔 SW-15Y23', 70, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5a251e42-0b63-4d5b-82e7-f30264cc1ed5', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'ZN23FK30', '苏泊尔 ZN23FK30', 34, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a7ce3fc9-e406-426c-8a13-986422c2440d', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'ET10ARF01-Y', '苏泊尔 ET10ARF01-Y', 34, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('17341d49-e480-45c1-8669-e9c5f58c5404', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'JT30AQ647', '苏泊尔 JT30AQ647', 176, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('59187154-a90f-44c0-a964-70c2cc754d9a', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCP56LW10象牙白', '苏泊尔 KCP56LW10象牙白', 117, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4a94dc3a-91cf-41f3-877f-2caa48724020', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'SF40FC396', '苏泊尔 SF40FC396', 6, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7a51a533-2978-46c7-9e94-f212d6735b73', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'VC30PAN01', '苏泊尔 VC30PAN01', 44, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('04b8782b-e0b3-462b-a48d-b04c025d8c91', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'JRD06', '苏泊尔 JRD06', 42, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6cf96489-84fc-4e06-a710-80a8f71104b6', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KG10AR10', '苏泊尔 KG10AR10', 30, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9e31faa2-4701-4b60-b05b-c53b6cadc60b', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV42BR10冰川银', '苏泊尔 KCV42BR10冰川银', 5, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9da3fcd0-cb5e-4cc1-b7b3-136f10bda247', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCV50CM20椰奶白', '苏泊尔 KCV50CM20椰奶白', 34, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6705142f-f2ae-4f2a-ba65-bea8f35597d8', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KCG35BT10流光银', '苏泊尔 KCG35BT10流光银', 6, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('520793b7-8b12-4cae-b8e4-22270fff9b06', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'HDL-F4A', '苏泊尔 HDL-F4A', 61, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('434a2a24-b86e-49f1-848c-736915598c7d', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'RC-D902', '苏泊尔 RC-D902', 24, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('2d16ba70-fd6d-4b5f-a501-d3945ad51284', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'YL229H2', '苏泊尔 YL229H2', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b07559e1-201e-4fa2-9876-bebf347c4c92', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'DG30YC816', '苏泊尔 DG30YC816', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('40504015-918c-47bb-9a6a-cdbfecaff6a9', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'GU-411C', '苏泊尔 GU-411C', 6, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4cb20d5e-3944-4e9d-b21e-bb8bbb0a3bd9', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'SF40HC0028', '苏泊尔 SF40HC0028', 65, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f9cb0bd2-5a6e-409a-8d95-5f6d43aa299d', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'VJ28RP03', '苏泊尔 VJ28RP03', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c8da45de-eafc-40cd-b0d4-1cf9c5cd215f', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'EHDL-F842A', '苏泊尔 EHDL-F842A', 4, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('77dd4e86-1a71-4a2f-923e-f49a8e2c493a', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'ET24MF01-R', '苏泊尔 ET24MF01-R', 85, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e509db7c-54b1-427d-ba60-478a4c43e4b2', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'EASF03A-300', '苏泊尔 EASF03A-300', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('cf0886f9-11c0-4435-a670-46e614845ba9', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'KJ55D78', '苏泊尔 KJ55D78', 83, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('fbabbd24-c591-4693-9b5c-19153d37c68f', '65fede50-a884-45f4-bb7a-cc514ab8adeb', '杭州舟亢仓库', 'D22E', '苏泊尔 D22E', 1, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5fb986c2-3c0a-4749-9105-845e015d40bb', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '12CM面粉筛KG12AE10', '12CM面粉筛KG12AE10', 1415, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('fffbeea1-983b-4a68-a92a-ca1600e46321', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '14CM面粉筛KG14AE10', '14CM面粉筛KG14AE10', 782, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5f017125-9c76-4ab8-b5f5-130e5f371061', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6915389885220-新款YS22E', '新款YS22E', 83, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('77046f3e-b1fd-4734-986c-4cf590ea9042', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6915389885244-新款YS24E', '新款YS24E', 80, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('36afcc39-0d00-41fd-8787-a95eba5e3778', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885510665-YW223BA2', 'YW223BA2', 450, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('98c4663e-4de8-4b5b-bf22-467cb70d807e', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885510979-新款YS20ED', '新款YS20ED', 83, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('bcb77321-7abe-45e7-af80-c47de5ea8c1f', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885510986-新款YS22ED', '新款YS22ED', 94, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('be09d379-e718-4a06-8f20-a43927ac4f1f', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885510993-新款YS24ED', '新款YS24ED', 66, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('de205c0f-75b5-4109-bc7b-e6845410e8e1', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885511082-EY223KDW2', 'EY223KDW2勃艮第红', 2266, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6eed6f1b-1f4b-42dd-b68f-585b9c136c97', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885511198-YW223SL1巧立压力锅', 'YW223SL1巧立压力锅', 148, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e9a28bcb-c90d-4c2a-9f4b-d111f8e3660e', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885511204-YW223SL2巧立压力锅', 'YW223SL2巧立压力锅', 70, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('eeebb479-77ef-4641-9d79-4554a56a3220', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885511211-YW223SL3巧立压力锅', 'YW223SL3巧立压力锅', 46, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6c530167-fec0-4d80-9023-3f3d233a1c0a', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885521258-316材质KC20KH510燕麦白', '316材质KC20KH510燕麦白', 98, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9ecf4858-1210-4d0d-8a1f-6900aaeb3429', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885521715-砧板BW402825AE1', '砧板BW402825AE1', 15, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6ba88a59-f846-4b38-84a3-fad8adcaa402', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885521722-砧板BW453025AE1', '砧板BW453025AE1', 10, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('bd5faddc-bb00-4515-88fc-b8ad0780c7f1', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885523672-KCG82AP10提梁壶', 'KCG82AP10提梁壶', 10, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('220b8c45-a2a2-42ca-8bad-ce62bace4699', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885524433-手提秤黑KGF50CJ11', '手提秤黑KGF50CJ11', 630, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f48524fd-a4bd-4309-8bae-9f0987c4e47e', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885524532-KCP60LK20春芽绿', 'KCP60LK20春芽绿', 43, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('3c0aa008-1b47-40ce-9c33-d4bc4c41e226', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885524587-辅食冷冻盒KGF50CB10', '辅食冷冻盒KGF50CB10', 19, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('402973ab-b9d9-4a85-8491-1dafa7b9534e', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885524884-竹砧板BD453222AL1', '竹砧板BD453222AL1', 9, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f48a9467-926e-4365-9bb2-53b23278aefe', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885524969-KCG35AH10楠木黑', 'KCG35AH10楠木黑', 16, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('bc89c455-5ff2-48c7-9e37-f1a2b360928d', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885525188-KCP95LN20影黑', 'KCP95LN20影黑', 47, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('380d3d77-a451-4def-b1bb-8e4f005560cf', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885525485-薄荷椰椰KCP70LJ10', '薄荷椰椰KCP70LJ10', 118, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d433da5e-6908-42a8-82f7-1abd700c102d', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885525508-草莓波波KCP70LJ10', '草莓波波KCP70LJ10', 119, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('650c39db-828d-4188-9511-cec8d855d238', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885525546-KCG30BE10儒雅黑', 'KCG30BE10儒雅黑', 13, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ebb599fc-2f07-4a9d-b3ef-ba6dd7f1b019', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885525553-KCG30BE10雪峰白', 'KCG30BE10雪峰白', 5, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f3114240-7fe6-4ce9-85b0-b2cf21255bd6', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885525621-硅胶围兜KGF21CM10', '硅胶围兜KGF21CM10', 82, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('14ada2d4-c201-4aaa-bc8c-c0bd614b5fde', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885525638-KGF20CN10储奶袋', 'KGF20CN10储奶袋', 71, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e0fc01c0-298f-4a19-9b56-6b43db950834', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885525836-KCV65BG1嫩绿芭乐', 'KCV65BG1嫩绿芭乐', 19, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d30a42bf-b036-4c47-b6dc-11463bcd4364', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885525843-KCV65BG1酷粉黑莓', 'KCV65BG1酷粉黑莓', 11, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b04089ee-7d63-4298-a6ae-4df3fab15318', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885525850-KCV65BG1淡紫奶芋', 'KCV65BG1淡紫奶芋', 24, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('acf5242a-daee-45f4-9660-c13534da4a2b', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885525881-揉面垫KDB62AN10', '揉面垫KDB62AN10', 47, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4c99e99f-ea24-461e-9bd7-7d6dc350317d', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885525904-无色揉面垫KDB64AP10', '无色揉面垫KDB64AP10', 432, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('12875c70-a337-4c44-bd8e-cef677701043', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885525911-无色揉面垫KDB72AP10', '无色揉面垫KDB72AP10', 1282, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8ba8c853-9ef9-4cfb-887e-c48b298dd0b0', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885525942-油刷小号KDB01AR10', '油刷小号KDB01AR10', 245, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('161f4353-5d86-4549-9cd3-2dbe63bbf963', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885525959-油刷大号KDB02AR10', '油刷大号KDB02AR10', 21, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4d6b0027-2cad-4cdb-8e98-1d41fc0583b2', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885525997-抗菌KLA40AN10钢锅铲', '抗菌KLA40AN10钢锅铲', 59, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('bf93a3f5-6039-4374-b819-68232f3990b1', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526000-抗菌KLF40AN10硅胶锅铲', '抗菌KLF40AN10硅胶锅铲', 59, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('522cbbec-34e6-429a-be82-e4d4a1301feb', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526017-抗菌KLB40AN10大汤勺', '抗菌KLB40AN10大汤勺', 31, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4b9bdd54-7736-46e7-9596-7443ca853a9d', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526024-抗菌KLC40AN10大漏勺', '抗菌KLC40AN10大漏勺', 111, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1c51cc97-472a-49a8-ae79-a69db11db00c', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526055-KCV65BG1柔和桃', 'KCV65BG1柔和桃', 28, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('510d2e2b-5a5d-4afe-82e6-1d0d75bb73f6', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526086-KGF30CS10含盖', '窄版KGF30CS10含盖', 5, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e506e6b9-4bf5-4e60-a8d1-2fbd9f251a17', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526109-硅胶手套KGF27CT10', '硅胶手套KGF27CT10', 182, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ff37d151-ab10-4ad8-9b06-e1627fb07eee', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526116-定时器KGF19CU10', '定时器KGF19CU10', 16, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('654177f0-cb39-415f-901a-702c4cfb338c', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526123-不锈钢TK24004E1两件套', '不锈钢TK24004E1两件套', 163, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e6d29671-308b-4ad0-8127-6cbfe3dafbd8', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526130-不锈钢TK24005E1三件套', '不锈钢TK24005E1三件套', 73, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('808d29e3-3ef4-4bcb-9002-12a1f36d2ecc', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526147-不锈钢TK24006E1四件套', '不锈钢TK24006E1四件套', 230, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('69268fcd-c8b2-4dde-8d66-be60e244f25f', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526192-KCV80BM10T-GD', 'KCV80BM10T-GD', 19, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('05052922-a65a-4804-b77a-b975d3f8e424', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526291-木柄五件套TK24007E', '木柄五件套TK24007E', 103, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a2e9464d-568b-4374-9014-cd20d5e3e64a', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526307-KCV12BP10儒雅黑', 'KCV12BP10儒雅黑', 21, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f89522b9-bbf8-46b5-a56a-9f2de772207d', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526314-KCV15BP10儒雅黑', 'KCV15BP10儒雅黑', 19, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('67e2c169-db89-4b93-9bde-3a69f8d03389', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526338-KCV20BP10儒雅黑', 'KCV20BP10儒雅黑', 76, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5e47b145-54c3-47a0-81c2-46983371ec08', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526345-KCV20BP10流光银', 'KCV20BP10流光银', 34, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('763d91a1-7f5b-45a1-a270-e3c5711343ce', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526352-KCV25BP10儒雅黑', 'KCV25BP10儒雅黑', 11, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4baba417-bff1-4676-8837-a988b774f75a', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526376-KCG20AS50红帽熊熊', 'KCG20AS50红帽熊熊', 16, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('24cc5a9a-194a-47e6-b0fe-4f217f208c34', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526383-双色煎铲KLF30AK10', '双色煎铲KLF30AK10', 289, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('2cad3f40-bbbd-4e31-9957-bab5e8bfba28', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526390-双色漏勺KLC32AK10', '双色漏勺KLC32AK10', 708, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('870e0f15-6047-43b3-b400-bfeb4b1b24b7', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526468-316材质KC23KH510薄荷绿', '316材质KC23KH510薄荷绿', 23, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('96265acb-e483-40da-98d2-cf7172fbb99b', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526475-316材质KC23KH510燕麦白', '316材质KC23KH510燕麦白', 13, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1dd42f38-57f4-4e79-a52f-3848bd783b6c', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526512-KFS10AE10罗勒青', 'KFS10AE10罗勒青', 350, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('398f7b1f-7b2d-4141-8b06-a4fb56d9b8c7', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526529-KFS10AE10烟花粉', 'KFS10AE10烟花粉', 6, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('38ef6903-cadb-4bc5-9b79-1c8e519feb89', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526536-油刷瓶KGF06CV10', '油刷瓶KGF06CV10', 1295, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('2133d521-b023-442c-a9ee-e6fef0430100', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526543-切菜器KGF04CW10', '切菜器KGF04CW10', 749, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5c5e1735-99e4-468b-aaf3-54b076717caf', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526581-电动打蛋器KGE01CX10', '电动打蛋器KGE01CX10', 812, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('829688e0-2ab3-4b66-817d-4b936a732990', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526598-KFS13AD10生酪咖', 'KFS13AD10生酪咖', 39, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4da42ce7-6a28-4077-8635-a624c4a48753', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526604-KFS13AD10冬枣青', 'KFS13AD10冬枣青', 86, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('85ab1dd7-91e4-4b87-b5ce-77c328756b93', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526659-蒸格EZ20ADS01', '蒸格EZ20ADS01', 568, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b5289f88-0854-49f0-a620-e4b3761ad2bf', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526666-蒸格EZ26ADS01', '蒸格EZ26ADS01', 297, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('46446e0c-9446-439a-90dd-66c913659c95', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526710-KCV50BA20优雅白', 'KCV50BA20优雅白', 27, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7d6b0521-d9f4-42ab-91dd-a9ade062f831', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526734-KCV50BA20薄荷绿', 'KCV50BA20薄荷绿', 31, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ea8ca604-7a35-4e75-81a8-3eafe4724d75', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526840-刀具TK24008E', '刀具TK24008E', 721, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9283cbdc-aef3-4c5e-8519-a233e55fe5c6', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526864-刀具KEG180AL10', '刀具KEG180AL10', 29, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1b7fdfca-aa5a-40d0-b6f5-d7cd4486793f', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526871-刀具KEA180AL10', '刀具KEA180AL10', 7, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('27ec0e00-da03-4b2f-999d-726d5654fbf4', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526888-刀具KEF185AL10', '刀具KEF185AL10', 13, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8a594380-616f-48b9-9392-678e6317b677', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526918-KFP15AF10桃芽粉含布包', 'KFP15AF10桃芽粉含布包', 350, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9aa49fa8-a3dc-48db-ae90-c09856a6c21a', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526925-KFP15AF10烟柳绿含布包', 'KFP15AF10烟柳绿含布包', 2386, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d254f7a1-cfb2-4baa-8519-510ca20de3c6', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526932-KCG19AK50抹茶绿', 'KCG19AK50抹茶绿', 26, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ed946e28-575c-496e-b108-11c8098541c9', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526949-KCG19AK50奶油白', 'KCG19AK50奶油白', 49, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('86e5afcf-072d-47eb-ac06-f942bbb029c0', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526956-KCV50AJ10陨石灰', 'KCV50AJ10陨石灰', 115, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('23de0712-22e5-41f1-aa64-b5bfb9251abc', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526963-抗菌砧板BP302012AR1', '抗菌砧板BP302012AR1', 61, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9d6c2068-0a38-4e51-8f2f-00f70088dec5', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526970-抗菌砧板BP362413AR1', '抗菌砧板BP362413AR1', 22, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('bf9415e6-fc43-4d5b-92b4-77e3178f59ed', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885526987-抗菌砧板BP402813AR1', '抗菌砧板BP402813AR1', 33, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('07646be3-4691-487f-a26d-f6d9ce169ce8', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885527052-KCG16AK50石榴红', 'KCG16AK50石榴红', 7, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('90fdf25c-149d-4d2d-ae8f-bda6eab25ba2', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885527168-棋格盘砧板BC382625AU1', '棋格盘砧板BC382625AU1', 1159, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c6a44c60-baf8-4741-a45f-a5fdc13122d3', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885527175-棋格盘砧板BC402825AU1', '棋格盘砧板BC402825AU1', 2259, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('49a4e4c7-9510-4fa4-8da2-8c930a4747a8', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885527182-手柄砧板BC282020AV1', '手柄砧板BC282020AV1', 339, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('bc7789f5-5514-4c16-8d6b-33c6b7124c2b', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885527199-手柄砧板BC322320AV1', '手柄砧板BC322320AV1', 226, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('41d9d776-e58e-4da3-ba8b-ca6c293997d2', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885527564-KCG17BH50奶油白', 'KCG17BH50奶油白', 133, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('04939b0e-367b-4e74-8e37-04656fd5a508', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885527588-KCG20BH50奶油白', 'KCG20BH50奶油白', 108, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('596a0e92-890a-498f-a34b-542dd970fee1', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885527656-刀具削支刀KGF19BX10', '刀具削支刀KGF19BX10', 91, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0a69de24-502e-4c99-bd30-fc8360601ad2', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885527748-油壶KGF50CY10', '油壶KGF50CY10', 291, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('fb2fcac2-71cc-4dce-b785-367141bab72a', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885527755-抗菌砧板BP282005AW1', '抗菌砧板BP282005AW1', 217, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('62eb9cb8-9c27-4bea-ad8a-992827a8266e', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885527762-抗菌砧板BP342405AW1', '抗菌砧板BP342405AW1', 234, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b6910739-12b5-421a-b5a8-084b8b810c39', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885527779-抗菌砧板BP392705AW1', '抗菌砧板BP392705AW1', 104, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('138e26ea-6205-41e6-b654-b42a68164aee', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885527786-抗菌砧板BF403019AK1', '抗菌砧板BF403019AK1', 445, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6a02a5a5-8810-4b7c-b712-aa265fe3404a', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885527816-KCG13BK10品茗杯', 'KCG13BK10品茗杯', 32, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f51fd660-b84b-47de-ae11-fae03d1d7026', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885527823-镂空导热板KGF26DB10', '镂空导热板KGF26DB10', 224, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('cd9a760c-1721-4c6e-a1a4-eba81be122c1', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885527830-KCV70BJ10海盐白', 'KCV70BJ10海盐白', 55, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a59fe7f1-8ee2-4ab8-9481-199292588cac', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885527847-KCV70BJ10薄荷绿', 'KCV70BJ10薄荷绿', 17, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('2594a15e-8087-4838-ab0c-9bf1df7ab679', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885527861-KCV55BJ10海盐白', 'KCV55BJ10海盐白', 111, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('bccb5127-3ec2-4c6b-bf92-e73ecb23e37c', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885527878-KCV55BJ10薄荷绿', 'KCV55BJ10薄荷绿', 5, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6aa61f96-0149-4adc-9a53-26a81bc92dec', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885527977-KCV15BE10薄荷绿', 'KCV15BE10薄荷绿', 9, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5ba7e0c8-d813-44bd-b750-ffb3170cadee', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885528059-台面上水器KGE25CZ10', '台面上水器KGE25CZ10', 7, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0597e6b4-bc46-49c0-855c-2886a1ff2ac6', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885528080-KFB70AG10罗勒青', 'KFB70AG10罗勒青', 17, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('2ea11714-f246-4fba-b19f-4f380ab0994c', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885528097-KFB14AG10罗勒青', 'KFB14AG10罗勒青', 541, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('795b6d02-d75a-49ac-a8d5-406435714864', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885528103-KFB21AG10罗勒青', 'KFB21AG10罗勒青', 408, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('dd999c87-3403-4b20-97fc-f16f9dc7cff2', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885528141-注水碗KCV53BN10橡子棕', '注水碗KCV53BN10橡子棕', 75, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('521f699c-9a67-4710-ab21-c15ef8b83186', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885528264-抹布架KWA3190AM10', '抹布架KWA3190AM10', 23, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1c0e5f3d-b23b-49fd-902d-e4494441356f', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885528318-KCV48BW10酷乐银', 'KCV48BW10酷乐银', 39, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f348c8aa-a940-48d9-bb0a-caa8473ce150', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885528349-KCV57BS20鳄鱼-带杯套', 'KCV57BS20鳄鱼-带杯套', 56, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a75ed92e-3647-4cee-97fb-11f458cf711c', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885528356-KCV57BS20熊猫-带杯套', 'KCV57BS20熊猫-带杯套', 59, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c3beaedb-3d9d-449a-876f-f49e6c4f55bd', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885528363-KCV57BS20独角兽-带杯套', 'KCV57BS20独角兽-带杯套', 29, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('22441ae9-3351-4672-9430-80d056ae46f5', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885528370-KCV57BS20柴犬-带杯套', 'KCV57BS20柴犬-带杯套', 28, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b08fda57-b83d-4040-bf22-b64b47cf67c1', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885528387-KCV50BQ20气泡粉', 'KCV50BQ20气泡粉', 550, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('bab0e82e-d3cb-4c55-95d7-a026bdd46b50', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885528394-KCV50BQ20清风绿', 'KCV50BQ20清风绿', 577, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9a470800-00d4-45d0-a2e7-49607b4668f7', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885528400-KCV50BQ20天幕白', 'KCV50BQ20天幕白', 2374, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('3e6c7130-a72a-4a1a-bd7e-e45d1ca335ce', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885528455-KFV13AC10薄荷绿', 'KFV13AC10薄荷绿', 583, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('862e37a7-858e-4648-bc70-d3c308f28051', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885528462-KFV23AF10沙漠金', 'KFV23AF10沙漠金', 194, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9cf69e6e-1f3e-426d-beb8-83acf454e24d', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885528479-KFV27AF10沙漠金', 'KFV27AF10沙漠金', 179, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4177a0ff-1c77-4b88-ab37-9681bceb26cf', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885528486-KCV50BQ20岩木黑', 'KCV50BQ20岩木黑', 240, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('af5e2645-4456-485e-be4d-7464c54a1b27', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885528493-KCV20AK10轻烟粉', 'KCV20AK10轻烟粉', 94, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7708d693-3260-4a69-9f85-66acb08ea40c', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885528509-KCV20AK10薄雾绿', 'KCV20AK10薄雾绿', 138, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0150080b-71f9-4caa-86a2-b533ec7640b7', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885528516-KCV20AK10月光白', 'KCV20AK10月光白', 67, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d6e971cc-88bf-4a26-9b15-876b7778d305', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885528523-KCV38CA10儒雅黑', 'KCV38CA10儒雅黑', 33, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('521aaa86-326d-471c-86bc-18e01fcd3a60', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885528530-KCV38CA10绅士蓝', 'KCV38CA10绅士蓝', 5, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a7e579e6-fe9e-4211-80b0-c2374a80d7b9', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885528554-KCV50CA10儒雅黑', 'KCV50CA10儒雅黑', 5, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('3a75a392-5c30-4370-8029-552197054814', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885528561-KCV50CA10绅士蓝', 'KCV50CA10绅士蓝', 7, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a5a45ed6-0533-42e9-a3e6-442c21c668fd', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885528677-KCV57BS21鳄鱼-不含杯套', 'KCV57BS21鳄鱼-不含杯套', 53, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('80b5db14-92ec-4c9c-b263-80bca2b78a4a', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529018-KCV70CG10流光银', 'KCV70CG10流光银', 138, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b5ea7595-d1cd-4807-a3dc-323c0b5c39f6', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529025-KCV70CG10曜石黑', 'KCV70CG10曜石黑', 110, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('3105d7bc-6f90-4ed1-b151-4db62e00ad0a', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529032-KCV10CG10流光银', 'KCV10CG10流光银', 87, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e28a7787-af3b-4f59-a8bb-bf84c6ee4ac4', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529049-KCV10CG10曜石黑', 'KCV10CG10曜石黑', 22, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('cc549555-0b5f-4798-8a4c-26d8f82beed0', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529056-背带款KCV50CK20粉柚', '背带款KCV50CK20粉柚', 906, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('eea57784-618b-4a15-9122-a3d3f8cc9da5', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529063-背带款KCV50CK20芽绿', '背带款KCV50CK20芽绿', 622, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('16b8ca5c-79ff-4b0b-a0a3-04d33987ca86', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529070-背包款KCV50CL20粉柚', '背包款KCV50CL20粉柚', 119, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('28bd95a4-662c-441f-b5ec-6a430a6f45d9', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529087-背包款KCV50CL20芽绿', '背包款KCV50CL20芽绿', 21, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c30eab29-9610-4073-89b3-f18d951a2f2a', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529254-锅具分层架KWA2752AN10', '锅具分层架KWA2752AN10', 67, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8dd7c482-1307-4f10-9cfc-e5b3378239b4', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529261-锅具分层架KWA2743AN20', '锅具分层架KWA2743AN20', 39, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('05929222-2c0a-4456-993d-1a264bc3603f', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529278-PPSU辅食碗勺KGF25DE10', 'PPSU辅食碗勺KGF25DE10', 6, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('2ad80140-80b6-4ec3-b5f5-db77aa98f6a4', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529308-上水器KGE01DG10', '上水器KGE01DG10', 141, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d501f2db-04ce-4c69-a87b-351af6359df8', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529360-一杯双盖KCV50CM20椰奶白', '一杯双盖KCV50CM20椰奶白', 18, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4349e867-70bc-482e-9bb6-b454d817ee64', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529377-KCV50CN20橡子棕', 'KCV50CN20橡子棕', 53, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('99527a23-312a-41da-a93a-89f30bdccf50', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529445-KCV50CR10奶油白', 'KCV50CR10奶油白', 668, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7f032310-4604-4518-bba5-5b5eb9aced2b', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529452-KCV80CR10奶油白', 'KCV80CR10奶油白', 298, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('64c75eb3-55a1-4494-97e2-1f0cbf8d311a', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529476-KCV80CR10薄荷绿', 'KCV80CR10薄荷绿', 204, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f29058bf-df24-41ce-9c0f-494e3cee478f', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529551-KFV23AF10鎏金', 'KFV23AF10鎏金', 115, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('fb7a97b7-7e7f-4849-b1db-fecfb97ee019', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529575-KFV27AF10鎏金', 'KFV27AF10鎏金', 222, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0cec0b1e-3ff2-4dea-8520-923bdb6e0496', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529612-陶瓷KCV70CJ10海盐白', '陶瓷KCV70CJ10海盐白', 69, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c8b89abb-dd1a-435f-afb0-b062353b404a', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529629-陶瓷KCV55CJ10海盐白', '陶瓷KCV55CJ10海盐白', 47, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('961645c4-7d25-4e99-a3f8-b2ca03652433', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529636-砧板BF412720AZ1', '砧板BF412720AZ1', 168, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5dd43349-2eb8-4e62-a356-ae2ca3427cb6', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529643-砧板BF453120AZ1', '砧板BF453120AZ1', 57, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8fe7003f-6875-4c58-abdf-91cf69dc2bbd', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529650-KCG13BH50奶油白', 'KCG13BH50奶油白', 71, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7bdbe30f-752f-413a-a761-eb949665b565', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529667-KCG17BH50复古橙', 'KCG17BH50复古橙', 63, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('3b232ad3-dec3-406f-9d1a-754f5f884644', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529704-刀具KEG180AR10', '刀具KEG180AR10', 27, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f0231591-dc14-4930-9541-8cc0e5e1b88a', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529803-电动开瓶器KGE20DH10', '6950885529803-电动开瓶器KGE20DH10', 1382, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8e837119-f4fd-4af1-82e1-d7f6c43f4650', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529810-吸油纸KDB18AT10', '吸油纸KDB18AT10', 442, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1ec4525a-1f5e-4270-9a93-d0ca21d6ef03', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529872-KFS10AE10生酪咖', 'KFS10AE10生酪咖', 124, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('55b12d51-d262-4cc7-96ab-5b6f4cb55de3', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529926-钛内胆KCV53BN10橡子棕', '钛内胆KCV53BN10橡子棕', 29, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b7fabdb3-db02-4a3c-8605-35c24131dc0b', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885529940-刀具KEA190AW10', '刀具KEA190AW10', 35, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('28cf8fcc-cf5f-4367-8f6b-cb123d506d47', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532100-蒸锅SZ32VA1', '蒸锅SZ32VA1', 91, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('87dd1395-2a50-4d52-80b1-dcb4817c1ad1', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532131-烧水壶SS40P2', '烧水壶SS40P2', 21, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4f50dfe8-3f9e-4228-ad52-9f2eddddd6ee', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532148-烧水壶SS50P2', '烧水壶SS50P2', 7, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d72bad73-96e8-4a20-8d89-4c046f222aad', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532155-EZ32YAS01', 'EZ32YAS01', 80, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8fe115d4-0878-445b-9614-6322ccdf406d', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532162-蒸鱼锅EZ37AZS01', '蒸鱼锅EZ37AZS01', 9, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('44c46bf9-1f36-404f-a111-e06001ff2632', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532193-蒸锅EZ34YAS01', '蒸锅EZ34YAS01', 43, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ecfabdf6-4d4e-4a3c-a19b-9c0f0ffb1e59', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532223-蒸锅SZ30E7', '6950885532223-蒸锅SZ30E7', 10, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('61a3b87d-2719-4a55-839e-fb4773004ced', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532230-蒸格EZ20ADAS02', '蒸格EZ20ADAS02', 48, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a6cab181-07fd-43b6-83ad-d485d6beed52', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532247-蒸格EZ18AZAS01', '蒸格EZ18AZAS01', 63, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0221cdc9-7066-4be0-8eed-e4cc85b6909b', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532285-KCV60CU10儒雅黑', 'KCV60CU10儒雅黑', 10, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1c9b6b10-3802-47d8-85a5-7ebe7b774e08', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532292-KCV60CU10陨石灰', 'KCV60CU10陨石灰', 17, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7337acdb-be01-4eda-9278-11ed6ac80d56', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532322-抽拉碗架KWA2641AQ10', '抽拉碗架KWA2641AQ10', 7, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f5c38237-87c9-427c-bd73-6f5b58d0803f', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532346-抽拉碗碟架KWA2641AQ30', '抽拉碗碟架KWA2641AQ30', 15, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a417f1e1-2613-42a9-a052-ef14d196fe52', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532353-KGF60DK10牛奶杯PPSU', 'KGF60DK10牛奶杯PPSU', 19, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1582392f-9dec-41dc-9523-fd7bbc60686c', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532360-KGF80DL10牛奶杯玻璃', 'KGF80DL10牛奶杯玻璃', 11, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ba8cffe1-9b8a-4f3a-992c-357f224621d9', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532391-KCG57BP10流光银', '6950885532391-KCG57BP10流光银', 196, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4d358ba4-7826-4f98-8255-35a857f46788', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532407-KCG57BP10行砚黑', '6950885532407-KCG57BP10行砚黑', 184, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e5102a79-3ab4-4c8d-b314-5ede9de03cc5', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532551-滑链密实袋KDB32AV10', '滑链密实袋KDB32AV10', 8, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('fad73bed-f2d5-476e-912c-1f046ec730bb', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532568-滑链密实袋KDB26AV10', '滑链密实袋KDB26AV10', 8, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8338b13b-650a-49ee-8427-31657ee18d31', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532575-滑链密实袋KDB23AV10', '滑链密实袋KDB23AV10', 8, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('fd48e228-71a0-4ec2-9563-efac2991ef69', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532582-制冰盒KGF64DJ10', '制冰盒KGF64DJ10', 88, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1e1d2ccc-defd-491d-bff1-d5e5b1326229', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532599-KGF32DK10制冰盒', 'KGF32DK10制冰盒', 717, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('180629ad-5779-41d0-b377-baa3ae8cc308', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532605-KGF64DK10制冰盒', 'KGF64DK10制冰盒', 164, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('85014cc6-a01a-43f3-b1f1-daf0a128d606', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532636-旋转米桶KGF28AG10', '旋转米桶KGF28AG10', 806, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0b06aa79-943f-4597-a442-33c432e37f7e', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532650-钛玻璃杯KCG30BS10冰花银-茶水分离', '钛玻璃杯KCG30BS10冰花银-茶水分离', 17, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7871f000-ecd3-483f-8fcf-8149660d25cb', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532667-钛玻璃杯KCG35BS10冰花银', '钛玻璃杯KCG35BS10冰花银', 17, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6e8265a2-aadb-4dca-8e3c-45bf11b62cf1', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532704-KCG28BV10行砚黑', 'KCG28BV10行砚黑', 6, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('22deb5ab-affa-41a7-9167-1472070c5659', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532780-KCG35BY10雾隐灰', 'KCG35BY10雾隐灰', 159, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0fab29d0-0a60-4d41-92d4-c39b6f0aa7ff', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532797-KCG40BY10雾隐灰', 'KCG40BY10雾隐灰', 65, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a9a5b238-2d1c-4dd2-8091-cde88d23cf6a', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532841-圆孔砧板BB342418BC1', '圆孔砧板BB342418BC1', 9, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('170569f7-cbad-4310-9d62-890daa9f5321', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532858-圆孔砧板BB402822BC1', '圆孔砧板BB402822BC1', 39, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('fb5719ca-76d4-4933-a7df-771b780eb5ba', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532865-圆孔砧板BB453222BC1', '圆孔砧板BB453222BC1', 19, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7b1430df-ae6a-42e6-aa70-6bdf001aec27', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532872-KCP85LU10绅士灰', 'KCP85LU10绅士灰', 18, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('3f3dd840-0875-4a56-b324-48409f53edd4', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532889-KCP85LU10雅士白', 'KCP85LU10雅士白', 31, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8cce085a-5fc4-448d-8393-8df36da38a4c', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885532940-KCP60LV10麦芽白', 'KCP60LV10麦芽白', 234, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('33b9c471-3d77-4a5a-9ab5-5456ceb6cbd9', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533077-保鲜膜KDB30BC15', '保鲜膜KDB30BC15', 48, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0e881e65-f79a-4d1f-b91e-5a6054c53bdb', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533084-保鲜膜KDB25BC15', '保鲜膜KDB25BC15', 59, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('90142cf2-302a-42d4-b08d-b5d7ba7093e5', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533091-保鲜膜KDB20BC15', '保鲜膜KDB20BC15', 70, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c8a5384f-8503-4f12-8ee6-36c7b8229150', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533107-乌檀木砧板BC302025BA1', '乌檀木砧板BC302025BA1', 23, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('efa5562e-9faf-4045-9e21-31306d2c3b94', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533114-乌檀木砧板BC362625BA1', '乌檀木砧板BC362625BA1', 17, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('de1e576b-af83-473a-bbe6-2cd94c3bb88b', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533121-乌檀木砧板BC402825BA1', '乌檀木砧板BC402825BA1', 33, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5b0f4607-000e-4f92-896d-227d86b2bcee', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533145-乌檀木砧板BC453025BA1', '乌檀木砧板BC453025BA1', 8, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('163462b6-4838-47c8-9afe-d98341d5e16f', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533176-KCV55CV20机器狗', 'KCV55CV20机器狗', 49, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5c7d5c19-28cd-48a1-8440-43dcbc595bf1', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533183-KCV55CV20独角兽', 'KCV55CV20独角兽', 242, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d4257e44-e7bc-4d36-9a29-ed0d80302e69', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533190-KCV55CV20大熊猫', 'KCV55CV20大熊猫', 643, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('543e2cd3-3636-4c43-8f5e-4f6bb14b2956', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533206-KCV50CR10薄荷绿', 'KCV50CR10薄荷绿', 12, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f728c01f-61db-4129-93c2-ad3c5402effb', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533220-KFC55AJ10透灰', 'KFC55AJ10透灰', 313, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5a8a3be3-abef-42cc-8ec9-3ae6c60ef4db', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533237-KFC11AJ10透灰', 'KFC11AJ10透灰', 184, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0989e17f-7794-4dff-b7a2-32c3f280d2b1', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533244-KFC13AJ10透灰', 'KFC13AJ10透灰', 681, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('199ff85d-1c56-4029-aef0-42c3e8748084', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533251-KFC31AJ10透灰', 'KFC31AJ10透灰', 299, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('3a741366-395e-42c8-a1d8-3efd4940e9cd', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533268-KLA36AS10', 'KLA36AS10', 181, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4454070b-8a21-4d0b-906e-c25031728a74', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533275-KLB34AS10', 'KLB34AS10', 148, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7ed68f56-2a03-4f09-a7f5-9ef57faa1622', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533305-猪油罐KGF12DP10', '猪油罐KGF12DP10', 363, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8dfdbcad-61e2-4e70-999b-c87bdf4003d4', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533312-猪油罐KGF16DP10', '猪油罐KGF16DP10', 455, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ca557baa-17bd-4e33-b8ae-5a853cd8d844', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533336-KCV48CW10星河灰', 'KCV48CW10星河灰', 48, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5d0d0236-8f7f-4355-b65b-3bd5f860c597', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533350-KLA40AT10中式铲', 'KLA40AT10中式铲', 86, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8a595da1-6b29-4c5b-861e-b4b2b4b99c5b', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533367-KLK40AT10炒勺', 'KLK40AT10炒勺', 67, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('92d177fb-a419-4365-a075-7a3a93a4bd05', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533374-KLB40AT10大汤勺', 'KLB40AT10大汤勺', 274, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c98ecce0-3501-4b16-93ce-c10871e4b4e6', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533411-刨冰机KGF26DR10', '刨冰机KGF26DR10', 622, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b41d6ef0-7e76-4aa7-9ef8-cb47f70d58d8', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533428-316L材质KCV15BP20儒雅黑', '316L材质KCV15BP20儒雅黑', 54, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b800cfbf-0099-4a1b-ac2a-c038f10dbcb0', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533435-316L材质KCV20BP20儒雅黑', '316L材质KCV20BP20儒雅黑', 33, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('2b330bb6-9048-48a5-8027-73eb399df4fd', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533442-316L材质KCV25BP20儒雅黑', '316L材质KCV25BP20儒雅黑', 58, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c10badf2-942a-4fe5-b3e4-3368d664fd0c', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533459-KCP11LN20影黑', 'KCP11LN20影黑', 12, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e81781c6-833c-4602-9237-3331cff7fd4d', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533527-KLB30AW10迷你汤勺', 'KLB30AW10迷你汤勺', 8, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1d1ff225-5e7e-4e4e-808a-33b7093e8f30', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533534-KCV70DG20影黑', 'KCV70DG20影黑', 170, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('59cf7914-bfeb-471c-90ab-a1ca70c062ba', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533541-KCV70DG20亮黄', 'KCV70DG20亮黄', 313, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('30152a57-142e-47fe-96d5-a1e2845f14cc', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533558-KCV10DG20影黑', 'KCV10DG20影黑', 92, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('77a0ddcb-c57a-490e-8680-028d7b9d6612', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533565-KCV10DG20亮黄', 'KCV10DG20亮黄', 781, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4fda895e-cb9b-4908-8b98-c264c6bda830', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533633-KCG58CC10润玉白', 'KCG58CC10润玉白', 228, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6e2ee64a-fe5c-43f5-9e86-6a96d5381d46', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533640-KCG72CC10润玉白', 'KCG72CC10润玉白', 339, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('da0c6c53-39c1-4f27-ae74-fc9c673e90b2', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533664-KCG15BZ10燕麦白', 'KCG15BZ10燕麦白', 6, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5cbb7f87-3eda-4d8a-8f33-5d79d3e7afd4', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533671-KCG18BZ10燕麦白', 'KCG18BZ10燕麦白', 14, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('36fb1245-b6bf-4bee-9d99-a5c376f13bec', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533688-KCP57MB20桃桃粉', 'KCP57MB20桃桃粉', 23, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c2aada9e-1b5e-4f08-b63d-ed5ff7c9e949', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533695-KCP57MB20泡泡绿', 'KCP57MB20泡泡绿', 20, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('453aa394-5290-4c94-98a0-0d2743b186cc', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533701-KCP24MA10橡果棕', 'KCP24MA10橡果棕', 78, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('39a9db73-58b7-4635-b7d7-d662ff6f7087', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533718-KCP30MA10橡果棕', 'KCP30MA10橡果棕', 80, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7c76a275-67a7-4826-b839-b547673ec8ec', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533824-晶瓷KCV12CZ10晨曦白', '晶瓷KCV12CZ10晨曦白', 5, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('3d5b7d12-ce15-4617-8a67-9bb05ea6c3c6', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533831-晶瓷KCV12CZ10水天绿', '晶瓷KCV12CZ10水天绿', 14, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a23102e1-5057-4230-829d-6164aee9dc46', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885533848-晶瓷KCV12CZ10柔雾粉', '晶瓷KCV12CZ10柔雾粉', 45, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('dd79943f-888a-4420-ab0b-078653d8ce7f', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534081-晨曦白KCV10DU10', '晨曦白KCV10DU10', 15, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d51b55f9-0bca-473b-8837-f78a6c4f3448', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534098-林间绿KCV10DU10', '林间绿KCV10DU10', 37, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4ea469e3-d687-45dd-a970-cc6646855d91', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534111-晶瓷KCV10DA10林间绿', '晶瓷KCV10DA10林间绿', 10, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('44dd3818-5100-470c-bc4a-234dadeeea70', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534128-晶瓷KCV10DA10嫩桃粉', '晶瓷KCV10DA10嫩桃粉', 16, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d0573788-8ed5-4c1c-866c-8dd4ea1a8aaf', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534135-雨伞黄油小熊KCV10DA10', '雨伞黄油小熊KCV10DA10', 8, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1a74b1f7-968b-4aff-9fc4-91e7d6868fcc', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534142-泡泡黄油小熊KCV10DA10', '泡泡黄油小熊KCV10DA10', 13, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5a391e71-55d6-40c6-9b8d-83b33d3807a2', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534159-吨吨杯KCP52LZ20橡果棕', '吨吨杯KCP52LZ20橡果棕', 34, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('dc20e9f0-6a62-42f8-a2a0-1f108e6adb9b', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534166-吨吨杯KCP75LZ20杏白', '吨吨杯KCP75LZ20杏白', 35, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c92c4c79-f835-475b-8923-906e8234c560', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534210-小号牛津袋KWA2939AS10', '小号牛津袋KWA2939AS10', 96, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('667d5bcb-99f8-4479-9935-450ea1e9570a', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534227-中号牛津袋KWA3242AS20', '中号牛津袋KWA3242AS20', 288, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('b39437d3-3783-4a1a-9e73-5c5de5b55700', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534234-大号牛津袋KWA4050AS30', '大号牛津袋KWA4050AS30', 416, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('28ca4908-fb51-40bc-af78-db7b405276a6', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534241-特大号牛津袋KWA4260AS40', '特大号牛津袋KWA4260AS40', 130, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a5d952a6-f423-434a-a364-8e770975d6e6', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534302-KCV60DK20明黄', 'KCV60DK20明黄', 66, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1f4c49b0-9374-4dd7-8939-84054c0062af', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534319-KCV60DK20皓白', 'KCV60DK20皓白', 280, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d570c31f-ffd1-4e53-8404-4ad0f22d19c0', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534326-KCV60DK20影黑', 'KCV60DK20影黑', 35, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('97da5ef1-0972-4092-a044-5019a8205f66', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534364-日用剪KE09Q1', '日用剪KE09Q1', 5566, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('bb7d167c-7b34-4a69-b5b0-902b5cee5151', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534418-剪刀KE09S1', '剪刀KE09S1', 1294, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('2d4b5525-a6a3-4740-90c0-9136e76c35dc', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534456-自动翻盖油瓶KGF50DW10', '自动翻盖油瓶KGF50DW10', 72, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('88a8c1c8-4c30-4c62-988f-ba9343c61703', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534470-米桶KGF10DY10', '米桶KGF10DY10', 163, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9c07dc98-307a-4d08-9faf-41700087c087', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534487-米桶KGF20DY10', '米桶KGF20DY10', 505, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('22e1e5be-0960-4139-b286-9f065bf0b0c8', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534494-米桶KGF10DZ10', '米桶KGF10DZ10', 474, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('51c884df-fbc0-4a8b-9f3e-3085a5e7a2c7', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534500-米桶KGF20DZ10', '米桶KGF20DZ10', 130, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('90fa6a3a-bd1e-476a-aa1f-810e91da4918', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534517-咖啡秤KDB03BD10', '咖啡秤KDB03BD10', 261, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a80daf8b-0763-40da-9476-974c3c6eb306', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534524-电子秤KDB15BE10', '电子秤KDB15BE10', 256, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('90cc8627-4c85-4405-8a59-89c2bf5f627d', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534593-切菜器KGF05CB10', '切菜器KGF05CB10', 246, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('79cea99a-d59e-49e9-be9b-1dccfa72a8c4', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534609-制冰盒KGF21CD10', '制冰盒KGF21CD10', 9, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('77b9a0b0-d5c1-43c4-9ee2-231bef72dcdd', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534630-双面抗菌砧板BP302208BD1', '双面抗菌砧板BP302208BD1', 78, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4f5cb40c-92d2-4383-af28-2e95db8df8aa', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534685-KCV45CY10薄荷绿', 'KCV45CY10薄荷绿', 581, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('2669951b-01a0-4eb9-b1ad-7a40c170c687', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534692-KCV45CY10芝士黄', 'KCV45CY10芝士黄', 74, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('26828684-aff6-44e0-b7e3-d922c1cb28c2', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534708-KCV45CY10慕斯白', 'KCV45CY10慕斯白', 253, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('dd3c3095-b042-46eb-b0bd-1a91be16ebc2', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534715-KCV45CY10石榴红', 'KCV45CY10石榴红', 251, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6cba85a9-8d43-499a-a181-e497ba07a6d0', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534753-厨房多用剪刀KE09U1', '厨房多用剪刀KE09U1', 153, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c3ae78b3-2c94-41d2-ab89-961e62d4f741', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534807-吸管杯KCP50MF20萄萄紫', '吸管杯KCP50MF20萄萄紫', 15, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ed069cf1-7299-489d-a104-c03b7693ed37', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534814-吸管杯KCP50MF20莓莓蓝', '吸管杯KCP50MF20莓莓蓝', 72, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('2cf79192-fccd-4be1-92ac-3d69e1a888d2', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534821-手提秤KGF50CE10', '手提秤KGF50CE10', 272, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f2399a9f-0622-43a4-aa78-a153204a411b', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534852-KCG20BH50芝士黄', 'KCG20BH50芝士黄', 295, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('14325cb3-b06a-47f2-a687-3e13ec470211', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534869-KCG20BH50薄荷绿', 'KCG20BH50薄荷绿', 75, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('3b7c298d-712a-4f95-94ad-151ec3c07f91', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534944-KCV32CY10薄荷绿', 'KCV32CY10薄荷绿', 427, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9122a9a8-7871-409e-8ede-fd25577f8ab7', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534951-KCV32CY10芝士黄', 'KCV32CY10芝士黄', 133, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ef469da9-76f8-4818-b564-3198ddec74e7', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534968-KCV32CY10慕斯白', 'KCV32CY10慕斯白', 183, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('bd1f3156-60b1-4c23-9042-5fc00335b9cf', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534975-KCV32CY10石榴红', 'KCV32CY10石榴红', 160, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('fd318d2b-e183-41c7-a4f2-ce70b572dbeb', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534982-吨吨杯KCV45DN20桃桃粉', '吨吨杯KCV45DN20桃桃粉', 66, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1af7c3c7-db6c-4e98-b539-d24f8ad88ef6', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885534999-吨吨杯KCV45DN20泡泡绿', '吨吨杯KCV45DN20泡泡绿', 80, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e9a1fbd3-d74d-4d5d-9698-074e37e2111c', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535002-吨吨杯KCV60DN20桃桃粉', '吨吨杯KCV60DN20桃桃粉', 256, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('411e7c05-7d14-4e96-bd4f-f5616902f1dc', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535019-吨吨杯KCV60DN20泡泡绿', '吨吨杯KCV60DN20泡泡绿', 148, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('2c608785-cc1c-429b-be46-652f00a99968', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535026-奶酪白KFC40AK10', '奶酪白KFC40AK10', 1660, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('82b4fab5-5c20-49eb-8130-97669154b19f', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535033-奶酪白KFC65AK10', '奶酪白KFC65AK10', 892, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('09a22bce-5a56-42ec-ac65-d9c8d64106a1', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535040-奶酪白KFC11AK10', '奶酪白KFC11AK10', 730, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a817e6bd-9051-46ea-a3b7-01483497bc3a', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535057-奶酪白KFC104AK10', '奶酪白KFC104AK10', 1367, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f0bc622a-88a8-4ae2-b43d-a6e880309d20', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535149-晶瓷KCV75DR10暖阳黄', '晶瓷KCV75DR10暖阳黄', 9, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c0f8ffbb-d492-4d89-b6f5-c09d0c8b3406', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535156-晶瓷KCV75DR10暮霞紫', '晶瓷KCV75DR10暮霞紫', 20, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c0830efa-09d9-4172-9979-b1fd3b9ba053', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535231-上水器KGE13EB10', '上水器KGE13EB10', 1851, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('dd7ec4a3-e1cb-4403-a57b-cbb1535d035d', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535248-防滑提盘夹KGF18ED10', '防滑提盘夹KGF18ED10', 1215, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('719525a6-cf2e-468d-b34c-40ee22d09cf9', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535255-防滑取碗夹KGF18EF10', '防滑取碗夹KGF18EF10', 611, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('43ed7c91-3c6e-41b4-b0d2-398ca290fa8e', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535262-KFV15AG10莲子白', 'KFV15AG10莲子白', 409, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4873dba2-a421-4b7c-b463-06d9beab1135', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535279-KFV15AG10深巧棕', 'KFV15AG10深巧棕', 263, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('57fe3877-7abe-42e2-8398-c610680c0f3b', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535286-KFV20AG10莲子白', 'KFV20AG10莲子白', 563, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f08ead40-27d4-4b42-95b3-71e775c02f7c', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535293-KFV20AG10深巧棕', 'KFV20AG10深巧棕', 215, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4a2eadaa-e406-452d-8259-efcadc05cebf', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535309-KFV20AG10亚麻棕', 'KFV20AG10亚麻棕', 394, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('be69c08d-8b42-45a4-a01a-b6e200f46192', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535385-KCV30ET20桃桃粉', 'KCV30ET20桃桃粉', 152, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('60915fe5-7524-4884-b7f4-aedb91d20b1b', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535392-KCV30ET20莓莓蓝', 'KCV30ET20莓莓蓝', 117, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7ce89452-1ddf-48a0-9125-13bc69620497', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535408-KCV30ET20杏白', 'KCV30ET20杏白', 296, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('83ff72ee-ad91-412c-9955-d2d9adbf0630', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535422-KCV50ET20莓莓蓝', 'KCV50ET20莓莓蓝', 43, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('eaf3268c-cc0b-4853-b726-a1893e3dd9ab', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535439-KCV50ET20杏白', 'KCV50ET20杏白', 50, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('50d812ae-7feb-4e8a-89e3-6fdde233b842', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535538-KCV16DZ50奶油白', 'KCV16DZ50奶油白', 35, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8a92c88e-145d-4f25-a5a6-4ebae39d8387', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535545-KCV16DZ50青釉绿', 'KCV16DZ50青釉绿', 48, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('73d1cdce-acf9-433e-b3c8-077b4c8699c4', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535569-KCV20DZ50青釉绿', 'KCV20DZ50青釉绿', 20, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d564c1ee-1eb7-44f7-8d2a-70ad5b57e289', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535613-得闲KCV60EC10羊脂玉', '得闲KCV60EC10羊脂玉', 31, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d0de6278-8415-490f-8b7b-61cc86fa98f7', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535637-得闲KCV60EC10玄黑', '得闲KCV60EC10玄黑', 67, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9fafafc9-01e1-4e3d-890a-8b6c254000be', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535651-KFV25AJ10珍珠白', 'KFV25AJ10珍珠白', 32, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1e7e3c70-142e-4cab-8322-689a3040771f', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535668-KFV25AJ10栗果棕', 'KFV25AJ10栗果棕', 16, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('41ee3fa8-0156-41d3-b5ec-f3ad9cfa0be8', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535675-KFV31AJ10珍珠白', 'KFV31AJ10珍珠白', 124, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c03f8f35-32ee-4685-8c29-260c16e89cb9', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535682-KFV31AJ10栗果棕', 'KFV31AJ10栗果棕', 83, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e2883134-447b-4a95-bb3f-c5da9cd8b521', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535743-KFP15AL10大熊猫', 'KFP15AL10大熊猫', 108, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('85a31266-4632-4972-a4f6-6c872121a97c', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535750-KFP15AM10大熊猫', 'KFP15AM10大熊猫', 123, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6cfeac62-fe5b-4f90-96b7-23fdd06234f9', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535767-KFP15AM10独角兽', 'KFP15AM10独角兽', 12, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7edc2b31-0e21-477f-b44e-56dbc3aa969f', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535774-KFP20AM10滑雪熊猫', 'KFP20AM10滑雪熊猫', 85, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('692f329e-edc2-4394-8fb4-a0ee7c01ca0f', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535873-KCV10DY10珍珠白', 'KCV10DY10珍珠白', 11, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f172fcf6-6fa0-42ea-ac7e-c83b9ff6d2e8', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535880-KCV13DY10珍珠白', 'KCV13DY10珍珠白', 51, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('92a59f01-b884-4d40-b3c9-b08905670fdd', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535897-KCV13DY10麦芽黄', 'KCV13DY10麦芽黄', 28, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('47992956-df06-4d4a-b4e9-184cc8c380b5', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535903-KCV13DY10樱花粉', 'KCV13DY10樱花粉', 28, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('cbcd4399-059e-4f63-a25e-830ae25c950b', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535910-黑陶KCV10ED50', '黑陶KCV10ED50', 12, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4f92da09-ba7e-4f3e-b491-bd01796c159f', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885535927-紫砂KCV10ED50', '紫砂KCV10ED50', 11, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('faddd7f0-6aeb-464c-9b45-6b7489c5ca0c', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885536047-KC45FP10慕斯白', 'KC45FP10慕斯白', 23, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('86c96c23-1ce1-402b-9aa6-9048e62d101d', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885536078-KC45FP10嫩芽绿', 'KC45FP10嫩芽绿', 59, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('9a602d3a-e248-4b9a-bce5-91ade97f17e0', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885536085-KLA40AX10', 'KLA40AX10', 23, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('80efa59b-2a43-46b7-a064-3163eb65bad0', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885536092-KLB40AX10', 'KLB40AX10', 23, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('11be0ab4-8c8a-459a-9fe0-8588ff88967f', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885536108-钛砧板BF402820BH1', '钛砧板BF402820BH1', 66, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('dfd3856c-2b99-4e2e-bd89-426ff5231fbd', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885536115-钛砧板BF382620BH1', '钛砧板BF382620BH1', 17, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('db2c0969-3843-4b63-b6cb-94a22e0a865a', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885536269-KFC60AK10青提绿', 'KFC60AK10青提绿', 427, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('89b96853-c96b-4cbc-9163-3bef2457a212', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885536450-KCV20EV10樱釉粉', 'KCV20EV10樱釉粉', 241, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e04d4646-8d61-4576-b574-df2ba8f26ee3', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885536467-KCV20EV10芽釉绿', 'KCV20EV10芽釉绿', 114, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f22d0730-8f96-4b74-93ab-df4a421318ec', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885536474-KCV20EV10云纱白', 'KCV20EV10云纱白', 313, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('2143e468-8e04-47dd-8730-8f38ca9855ae', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885536504-316钢KCV75FE10晨曦白', '316钢KCV75FE10晨曦白', 39, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('2e2f357b-d2e8-4e99-992d-60be008be699', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885536573-筷子TK25011E', '筷子TK25011E', 371, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('530e6557-1fc3-42dc-833c-8082d89c3f68', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885536580-筷子TK25012E', '筷子TK25012E', 248, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c767b9a4-c55f-4d2c-a3ce-06beabb8d863', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885536597-316L不锈钢筷子TK25013E', '316L不锈钢筷子TK25013E', 3429, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('386e675f-ca6b-4e0b-b2ee-cb347e7805b6', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885536603-316L不锈钢筷子TK25014E', '316L不锈钢筷子TK25014E', 2019, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('755131c2-a7e4-4418-9ba6-181d732719cd', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885536689-钛杯KCV20EW10天幕白', '钛杯KCV20EW10天幕白', 24, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e6fd2a28-47d3-47f0-b7c6-33882df7c243', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885536696-钛杯KCV20EW10冰川蓝', '钛杯KCV20EW10冰川蓝', 8, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('96d46c2b-2e3d-45a0-a8f0-071d20618fed', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885536702-钛杯KCV20EW10晶璃粉', '钛杯KCV20EW10晶璃粉', 16, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('aa68cf29-de11-48b2-838a-b673d3687c40', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885536757-奶油黄硅胶铲KLA32BA10', '奶油黄硅胶铲KLA32BA10', 360, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('571f6102-c719-4a26-a2b3-1e5b13f5146a', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885536764-奶油黄硅胶汤勺KLB29BA10', '奶油黄硅胶汤勺KLB29BA10', 194, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4f001d4d-b8fd-4157-8534-efb2ae7df13e', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885536825-多功能封口机KGE10EK10', '多功能封口机KGE10EK10', 2257, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c50bad85-bb3c-4583-ad5c-29a1d0c4d769', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885536887-面包款揉面垫KDB70BL50', '面包款揉面垫KDB70BL50', 4570, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('58c0d4e5-1a0c-40a3-9abb-8036f7d7732c', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885536900-红檀木许愿筷TK25018E', '红檀木许愿筷TK25018E', 34, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0dc5d895-de9c-45d2-bbda-a13aeeb509e9', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885536924-黑金整木BW302025BM1', '黑金整木BW302025BM1', 271, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('c2d18887-909f-4f9a-ace5-ca6eda1f5db0', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885536931-黑金整木BW362625BM1', '黑金整木BW362625BM1', 514, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5ecc9e49-37b3-45bc-8595-93902ed4ec5b', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885536948-黑金整木BW402825BM1', '黑金整木BW402825BM1', 155, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('773f79b6-629a-4978-a005-562d4487235f', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885536955-黑金整木BW453025BM1', '黑金整木BW453025BM1', 36, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('4830603b-4498-428d-aa2f-53df71e82c69', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885537075-木柄不锈钢·迷你铲KLA33BC10', '木柄不锈钢·迷你铲KLA33BC10', 202, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6fa5d018-059d-4dea-aeb3-46112ae56dbf', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885542529-刀具TK1610Q', '刀具TK1610Q', 1125, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('74836ea1-be50-4bb1-8be0-9896ece6e454', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885544271-筷子TK2195E', '筷子TK2195E', 209, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a7e63dc1-dfa5-4ae7-aa24-e596764dee7b', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885544387-筷子TK2162E', '筷子TK2162E', 44, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5383dfb8-4838-4b7b-b5fb-d67f79460488', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885544394-筷子TK2163E', '筷子TK2163E', 353, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('fd6605ab-7b52-4021-8486-9ca50e258782', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885545186-陶瓷TP2408E椰奶白', '陶瓷TP2408E椰奶白', 556, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('88ff701d-4bf7-4493-bc6e-5802aac75cfd', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885545216-抗菌不锈钢筷TK24016E1', '抗菌不锈钢筷TK24016E1', 1022, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('eed2b91a-002f-4a03-8666-c2727f5e4d18', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885545223-抗菌不锈钢筷TK24017E1', '抗菌不锈钢筷TK24017E1', 1504, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6c04bc79-c9ee-436a-aa08-bb6d43e37d99', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885545254-钛筷KAD23AH10', '钛筷KAD23AH10', 655, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('59e863b4-16a8-42fe-99ec-ef2f25e03693', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885545261-钛筷TK25001E1', '钛筷TK25001E1', 120, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('6959aa89-da79-435d-bc50-baf9b4471b47', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885545285-刀具TK24022E1', '刀具TK24022E1', 20, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a5d4af9c-7b87-490a-9549-6147361a3dcf', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885545315-刀具TK25005E', '刀具TK25005E', 10, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e04bfed3-22a7-4285-8d24-1368bb93ac86', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885545322-奶酪白TK25002E1', '奶酪白TK25002E1', 11, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5941fab2-8f45-4e30-8b49-736f9632ad21', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885545346-麦芽黄TK25003E1', '麦芽黄TK25003E1', 5, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('023f8c3e-0df5-4ccd-8844-1fcda86f5f4a', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885545414-TP2508E', '6950885545414-TP2508E', 5, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e1834c47-3249-4bf5-9046-70b5d37bff7a', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885545421-辅食刀具TK25006E', '辅食刀具TK25006E', 41, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('f72288f6-574c-4cd3-8109-680564cea07b', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885545469-刀具TK25010E', '刀具TK25010E', 44, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('e5ca121e-f6fb-4006-a723-b423ee726ca2', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885554065-ET22MF01-BA罗勒绿', 'ET22MF01-BA罗勒绿', 7, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('019b4c18-9b75-43e3-86d5-4aaa1d43e1ad', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885554089-ET22MF01-GA石榴红', 'ET22MF01-GA石榴红', 7, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('7b988275-5366-421f-9c89-40bdc69408e7', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885554133-ET18LBP01-BK黑色', 'ET18LBP01-BK黑色', 14, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('14cf029f-c1dd-4acf-baa9-2733e55f175b', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885554140-ET18WBN01', 'ET18WBN01', 12, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('059cfac2-448c-4971-b643-448e2a819ca4', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885554362-奶锅ET16YHS01', '奶锅ET16YHS01', 37, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('a2882c67-402b-459d-8c74-e11538b11954', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885554379-奶锅ET18YHS01', '奶锅ET18YHS01', 42, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('76318657-92f4-4fee-807a-dccb8535ece9', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885554492-EB08AACT02', 'EB08AACT02', 575, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('dc2e0ac5-42e6-43be-b3b2-79bf9ea96258', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885554508-EB20AACT02', 'EB20AACT02', 2413, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('074d67c2-fe13-45d1-b43d-fa7da4c845bd', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885554515-EB30AACT02', 'EB30AACT02', 3528, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('84d9c10b-0dd9-428e-a50f-cfcb033a8623', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885554522-EB45AACT02', 'EB45AACT02', 517, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('ad4305e5-1903-4298-833f-3b10e79a59f2', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885554539-EB60AACT02', 'EB60AACT02', 263, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('0b8e869f-726e-468a-aab5-39aa193ce94c', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885554614-ET20ARF01', 'ET20ARF01', 28, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('36290263-a384-4350-93e9-9fe1b81ccb3d', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885554645-ET20YHS01', 'ET20YHS01', 242, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('fbce30ec-560f-422f-a0d9-6059dc2dbcae', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885554652-ET22YHS01', 'ET22YHS01', 575, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('1c157835-e320-4456-b658-1f22b85b3e23', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885554720-啫啫煲TB08AC3', '啫啫煲TB08AC3', 96, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('dc2474ac-c2b9-4278-a692-f874bbb30846', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885554737-啫啫煲TB16AC3', '啫啫煲TB16AC3', 256, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('023f373e-5327-4d68-a5be-2d7770108e27', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885554768-ET28AAS05复底清汤', 'ET28AAS05复底清汤', 573, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('5bc0bae8-022a-4f67-8998-afc28850ede3', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885554775-ET30AAS05复底清汤', 'ET30AAS05复底清汤', 1946, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('119f708c-1539-4f00-8d05-cc99e41b9f17', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885554812-陶瓷ET18AHBN03椰奶白', '陶瓷ET18AHBN03椰奶白', 253, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('8c95ebcc-d009-47b1-bd07-0be73c0d3b76', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885555017-ET16ABCS01', 'ET16ABCS01', 276, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('bf259cde-6870-4405-b05b-b0b495e7edea', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885555024-ET18ABCS01', 'ET18ABCS01', 186, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('d44c1d77-3016-4b50-9d1f-92c0987b46a4', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885555079-汤锅ET22AMAS01', '汤锅ET22AMAS01', 576, 0, 0, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO stocks (id, supplier_id, supplier_name, product_code, product_name, quantity, in_transit, price, updated_at)
VALUES ('2f2f761b-07d9-467d-860f-06ed4be0e71c', '4ab6920a-37d1-4bd1-8af2-5b8b353090a1', '上海至梵仓库', '6950885555086-汤锅ET24AMAS01', '汤锅ET24AMAS01', 2106, 0, 0, NOW())
ON CONFLICT DO NOTHING;

-- 导入商品档案
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('4b6f6d07-8c7e-438a-b549-5b8fea4b174e', '03S57-AP', '', '苏泊尔手持式吸尘器', '苏泊尔小家电', '吸尘器', '03S57-AP', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('284116a4-37a4-462f-8c4d-dfb08165774c', '0J38A805', '', '苏泊尔电烤箱', '苏泊尔小家电', '电烤箱', '0J38A805', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('170c9c30-17b0-4adb-998a-05a5bce0f260', '10000mAh(Max22.5W SE)', '', '华为超级快充移动电源/充电宝', '其他', '日杂', '10000mAh(Max22.5W SE)', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('3030714f-0a0a-4d16-be43-8fa7f40fbd9f', '108ET', '', '格来德泡茶壶', '格来德', '其他', '108ET', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('ab3f4717-d6dc-461f-9732-ad573fb9b2cf', '108ET1', '', '格来德泡茶壶', '格来德', '其他', '108ET1', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('882adc0b-f6ae-4153-af3f-8045d56dd110', '108S', '', '格来德电水壶', '格来德', '电水壶', '108S', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('e909cfbb-9eb2-4b16-b38a-53541b313557', '119939', '', '大卫小木马旋转拖把', '大卫', '日杂', '119939', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('25b6fb29-be3b-4fee-ab47-93b063d82358', '119939小木马', '', '大卫旋转拖把', '大卫', '日杂', '119939', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('d3b76eef-f23e-41cc-9fc1-b4d4d976ee94', '1201S', '', '格来德电水壶', '格来德', '电水壶', '9301', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('e97dc193-4142-4f3b-9a29-44aa4a56e1e7', '120R01', '', '美的消毒柜', '美的', '消毒柜', '120R01', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('db64d900-e28b-41c8-8569-84177a3321e3', '150M', '', '格来德电水壶', '格来德', '电水壶', '150M', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('baed3bcd-c6ea-4623-be62-3cf7f485800a', '150MK', '', '格来德电水壶', '格来德', '电水壶', '150MK', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('d04ac41f-78d9-4567-a82b-4205682d2415', '15L商用豆浆机滤网组件', '', '商用豆浆机配件', '九阳原磨坊', '配件', '15L商用豆浆机滤网组件', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('84be516e-b776-4ffd-aa5e-f31bd926f629', '15WY1J(office)', '', '九阳养生壶', '九阳', '养生壶', '15WY1J', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('c3277987-85ae-4a6d-963e-e14fb07fc4b2', '15WY2J', '', '九阳养生壶', '九阳', '养生壶', '15WY2J', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('c2b03056-0024-4de1-b0bc-139108c0f17e', '15Y05', '', '苏泊尔养生壶', '苏泊尔小家电', '养生壶', '15Y05', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('04156347-cec5-4c03-af20-c4bffc3707a1', '15Z605B', '', '九阳电饭煲', '九阳', '电饭煲', '15Z605B', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('8f2044b3-3a5e-42df-a728-5af0fc3378ab', '160S', '', '格来德电水壶', '格来德', '电水壶', '160S', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('73d8a1d8-cf4e-45b3-a251-eee278e25b5e', '1742S', '', '格来德电水壶', '格来德', '电水壶', '1742S', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('36a0d887-21bf-456d-a0ac-f6dcd0e8682a', '17WU1', '', '九阳电热水壶', '九阳', '电水壶', '17WU1', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('91567d31-c3f9-48ab-9291-cc9603329243', '17WU1B', '', '九阳电水壶', '九阳', '电水壶', '17WU1B', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('934c7d60-77e7-4057-b49a-73fa805a06d4', '17WU2', '', '九阳开水煲', '', '', '17WU2', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('9ed980de-35c7-49ca-875e-a63da933c67e', '17WU2T', '', '九阳开水煲', '九阳', '开水煲', '17WU2T', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('1d8710ca-fd83-4e6a-8bac-32c2a55781cf', '17WU2W', '', '九阳开水煲', '九阳', '开水煲', '17WU2W', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('59d63468-1fa6-4572-95d3-5c5e6c68a88c', '18P161-C', '', '九阳破壁料理机', '九阳', '破壁料理机', '18P161-C', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('545112f9-13ec-40f3-bc51-e8d85860ba92', '18WY20R', '', '九阳养生壶', '九阳', '养生壶', '18WY20R', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('4ea4bc1d-fcfe-4b09-86bf-3e6dbdecfc35', '18WY2R', '', '九阳养生壶', '九阳', '养生壶', '18WY2R', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('881097c0-4202-4b59-ac2c-022f0bc1b364', '1926Q', '', '苏泊尔套装锅', '苏泊尔烹饪用具', '套装锅', '1926Q', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('1f2cf963-4414-4870-8981-7c515bb8cf77', '1G1036', '', '芳草地钢丝球', '芳草地', '日杂', '1G1036', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('bd3c3dc8-3007-4e03-bd75-7d18d584b849', '1G1077', '', '芳草地百洁块', '芳草地', '日杂', '1G1077', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('073df9d0-5dc7-4254-886f-7ea4a773b29a', '1G1113*2', '', '芳草地百洁布', '芳草地', '日杂', '1G1113*2', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('97c3b42a-7417-405d-9c56-52e07fbab94f', '1G1133', '', '芳草地蒸笼布', '芳草地', '日杂', '1G1133', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('d2b8296e-ea5e-46b3-a119-66124f65346e', '1G3561', '', '芳草地吸油棉', '芳草地', '日杂', '1G3561', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('d1ce62dc-b54b-40ec-9dc3-bd5b8c9e8886', '1G3571', '', '芳草地吸油棉', '芳草地', '日杂', '1G3571', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('259b7618-bb29-4fca-bee0-0f0e7143a74e', '1G3762', '', '芳草地手套', '芳草地', '日杂', '1G3762', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('9b3e62e7-872b-4168-a167-918fd60e3178', '1G3763', '', '芳草地粘尘器', '芳草地', '日杂', '1G3763', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('c86c89b7-a735-4da1-bfbc-f0c04af85db5', '1G3765', '', '芳草地粘尘器', '芳草地', '日杂', '1G3765', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('6480ac15-448b-40ac-bc4f-8f5aca3aee75', '1G3777', '', '芳草地水槽垃圾过滤网', '芳草地', '日杂', '1G3777', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('da1bc250-ea1f-43d5-9be4-0b791f9d7288', '1G5302', '', '芳草地神奇抹布', '芳草地', '日杂', '1G5302', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('fbebf0f8-f086-4f4a-bfa2-04bb80451365', '1G5387', '', '芳草地一次性袖套', '芳草地', '日杂', '1G5387', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('b2fc9719-0a15-4d9b-a18c-3b119c1248c3', '1G5453', '', '芳草地手套', '芳草地', '日杂', '1G5453', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('1f1c603a-9040-4c49-b3c1-971593efe4b0', '1G5663*3', '', '芳草地蒸笼布', '芳草地', '日杂', '1G5663*3', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('59882099-02c3-480b-9243-f5faf9e1a045', '1G5821', '', '芳草地百洁布', '芳草地', '日杂', '1G5821', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('fd924629-3fb4-4ffa-9a3d-e7fb77e5d28f', '1G5852', '', '芳草地手套', '芳草地', '日杂', '1G5852', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('53cdd831-fe4d-4c95-9090-a179526b3304', '1G5871*2', '', '芳草地百洁布', '芳草地', '日杂', '1G5871*2', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('e537a0e9-47aa-4e38-9e7c-b425d65ab470', '1G5905', '', '芳草地围裙', '', '', '1G5905', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('152311e8-13da-4690-bc4b-6b0f890d876a', '1G6031', '', '芳草地手套', '', '', '1G6031', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('e29e7a1d-43c3-485d-a33b-edca6b5f5b1e', '1G6048', '', '芳草地手套', '芳草地', '日杂', '1G6048', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('8f87a7c2-23d1-41c5-813e-059361f3dd5a', '2001-C', '', '新思特奶锅', '新思特', '奶锅', '2001-C', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('6518f03d-0976-487f-bea8-052c7a6698f1', '20LA320-A', '', '九阳绞肉机', '', '', '20LA320', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('1848e2e8-acdc-4c2d-83fb-b5ab67a2be73', '20L白色单核', '', '百事车载冰箱', '其他', '日杂', '20L白色单核', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('5d890fc5-039c-4de5-be38-6e8b322bc7a4', '20L白色双核', '', '百事车载冰箱', '百事', '其他', '20L白色双核', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('7a79444e-47cf-4c60-a407-295d53685716', '20N1', '', '九阳电饭煲', '九阳', '电饭煲', '20N1', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('fea3751e-fa2c-4fc1-b1da-c5a33b231c94', '20N1F', '', '九阳电饭煲', '九阳', '电饭煲', '20N1F', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('fd2f9b79-c289-460f-89bc-0f0c0771032c', '20N6U', '', '九阳电饭煲', '九阳', '电饭煲', '20N6U', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('03904941-7b63-407a-9b88-0314624b1595', '20N7', '', '九阳电饭煲', '九阳', '电饭煲', '20N7', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('f08e88dd-6153-4baa-a79a-36a0cbf93d66', '20N7U', '', '九阳0涂层电饭煲', '九阳', '电饭煲', '20N7U', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('22c4039a-61c6-410f-b79a-6e66f51e65f0', '20WU3B', '', '九阳电水壶', '九阳', '电水壶', '20WU3B', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('1d665a9c-e562-447c-9fbe-f33bbf1b12ba', '20WU3T', '', '九阳电水壶', '九阳', '电水壶', '20WU3T', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('fec2a83a-20c0-4c13-bb6d-252f55a8e414', '20WY3J', '', '九阳养生壶', '九阳', '养生壶', '20WY3J', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('22ce0e9b-a114-455b-afbd-a6a077b8ca71', '21EV10芬妮鹿', '', '苏泊尔学饮杯', '苏泊尔餐饮具', '学饮杯', '21EV10', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('f1e6a6c8-c161-401a-b5b2-6e45af81168e', '220*240cm', '', '梦洁被芯', '梦洁', '日杂', '220*240cm', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('9af03b88-94cb-4e1e-83f4-7ba2bd4aa67a', '23FK930', '', '苏泊尔电蒸锅', '苏泊尔小家电', '电蒸锅', '23FK930', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('f5446643-aa20-4fb6-8100-097e11d13b14', '2401-C', '', '新思特汤锅', '新思特', '汤锅', '2401-C', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('1faca32f-6eb3-46af-999e-de13cc394100', '2808-C', '', '新思特汤锅', '新思特', '汤锅', '2808-C', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('c8476788-6e8a-44e1-ac75-6435e1530eaf', '30FC789', '', '苏泊尔电饭煲', '苏泊尔小家电', '电饭煲', '30FC789', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('625b7f52-cb1c-4fa5-9181-b0efd0423d73', '30FC996', '', '苏泊尔电饭煲', '苏泊尔小家电', '电饭煲', '30FC996', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('6744f653-2fd5-4f67-ade9-ef9c6adfd6ba', '30FK606', '', '苏泊尔电烤箱', '苏泊尔小家电', '电烤箱', '30FK606', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('0595c714-d9d8-4654-be9e-a9c4b7e23784', '30N1', '', '九阳电饭煲', '九阳', '电饭煲', '30N1', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('fdb6d314-0226-4d01-ad83-5b64662adc49', '30N1-B', '', '九阳电饭煲', '九阳', '电饭煲', '30N1-B', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('26de2509-2ddb-44a2-b60d-962e7f1550e1', '30N1S', '', '九阳电饭煲', '九阳', '电饭煲', '30N1S', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('d5ca33fd-4d0a-41bb-8d70-ace500f597b0', '30N1U', '', '九阳电饭煲', '九阳', '电饭煲', '30N1U', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('c323f41d-2532-4955-afaa-339f12526ed8', '30N2', '', '九阳电饭煲', '九阳', '电饭煲', '30N2', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('ddf58747-588e-4dd3-bbe3-b1facaa5f8b8', '30N5S', '', '九阳电饭煲', '九阳', '电饭煲', '30N5S', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('d3481c2d-c24f-48ad-820b-20068b7b8263', '30N6', '', '九阳电饭煲', '九阳', '电饭煲', '30N6', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('1a13678e-cbf2-4d60-befa-126928e6fafb', '30N6S', '', '九阳电饭煲', '九阳', '电饭煲', '30N6S', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('b38f29fd-230f-4a42-bb57-61904792bace', '30N7S', '', '九阳电饭煲', '九阳', '电饭煲', '30N7S', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('5648a8e9-ffc4-4d6c-b2a2-062803e73201', '30NS1', '', '九阳电压力锅', '九阳', '电压力锅', '30NS1', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('8534428b-f162-44c2-afc1-5542957556f8', '318K', '', '格来德电水壶', '格来德', '电水壶', '318K', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('5a5d1d7f-fc4e-4fe3-bb88-62dcf17c7304', '3201-C', '', '九阳炒锅', '九阳', '炒锅', '3201-C', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('ea16c347-0930-430b-bebe-226cc845dfaa', '3213-C', '', '新思特炒锅', '新思特', '炒锅', '3213-C', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('993dfeeb-9b16-42c8-b0ad-c0a0d80d3d10', '325S', '', '格来德电水壶', '格来德', '电水壶', '325S', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('ebab4dac-6f52-4098-8e31-8d6b14df02da', '32cm锅盖', '', '苏泊尔32cm锅盖', '苏泊尔烹饪用具', '配件', '32cm锅盖', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('8abc6bd4-b67e-45e3-aeaa-ec8d749a2250', '3G3107', '', '芳草地塑料杯', '芳草地', '塑料杯', '3G3107', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('44450efd-9e74-4c06-be26-fcaabc08467a', '3G3122单包', '', '芳草地塑料碗', '芳草地', '日杂', '3G3122', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('df119345-bc1b-4175-83db-f51a13f91a9c', '3G3126', '', '芳草地保鲜袋', '芳草地', '日杂', '3G3126', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('6288d137-2d73-45bf-9899-a9a07713c486', '3G3127', '', '芳草地保鲜袋', '芳草地', '日杂', '3G3127', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('c73b64c0-597a-4f11-8e30-a9afa5d6a36c', '3G3129', '', '芳草地棉签', '芳草地', '日杂', '3G3129', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('fb86dbfa-75b3-420f-9cd1-0ebd48bb1297', '3G3138*2', '', '芳草地牙签', '芳草地', '日杂', '3G3138*2', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('9fe82986-3605-447c-9243-eef2f3cf554a', '3G3155*4', '', '芳草地蒸笼布', '芳草地', '日杂', '3G3155*4', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('9e23eebd-8579-4adc-a048-bec936b943c6', '3G3156*3', '', '芳草地蒸笼布', '芳草地', '日杂', '3G3156*3', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('3452189f-e0ef-4623-8682-95169c0efe77', '3G3171', '', '芳草地垃圾袋', '', '', '3G3171', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('6a48a966-a13b-487e-8fe8-21b84b588058', '3G3191*2（新货号：3G6107)', '', '芳草地水果叉', '芳草地', '日杂', '3G3191*2', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('4bfdd135-7cac-4e0c-8e15-70d2fe4e8fb6', '3G3207*2（新货号：3G6106)', '', '芳草地一次性筷子', '芳草地', '日杂', '3G3207*2', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('84109637-87c2-4084-8500-0139c612db6a', '3G3227', '', '芳草地手套', '芳草地', '日杂', '3G3227', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('31546c28-0a03-4a46-a9af-672cc2d067ad', '3G3244', '', '芳草地塑料杯', '芳草地', '塑料杯', '3G3244', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('42f14f73-2641-43b3-af80-8c63d3cc5f78', '3G3244*2', '', '芳草地塑料杯', '芳草地', '塑料杯', '3G3244*2', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('f1a1cca6-ba32-4a5d-a6cf-8c69f45d90fd', '3G3246', '', '芳草地纸碗', '芳草地', '日杂', '3G3246', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('93180e24-43a4-4e38-8792-5c8d193336fd', '3G3253', '', '芳草地吸管', '芳草地', '日杂', '3G3253', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('21d8d3a4-1352-4cf6-9225-c32c3002c8e5', '3G3253*5', '', '芳草地吸管', '芳草地', '日杂', '3G3253*5', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('1ba31507-88c6-40d3-811c-95182abe32c4', '3G3256*5', '', '芳草地垃圾袋', '芳草地', '日杂', '3G3256*5', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('143df292-4370-4d43-a1ec-d61e4241e934', '3G3257*4', '', '芳草地垃圾袋', '芳草地', '日杂', '3G3257*4', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('2cfa0a81-560f-4ce6-9a22-b636546b91f3', '3G3258', '', '芳草地垃圾袋', '', '', '3G3258', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('b85cf592-5ad6-4847-91a1-5221ef943eac', '3G3270', '', '芳草地蒸笼纸', '芳草地', '日杂', '3G3270', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('0287af44-b237-4102-9046-3d19914eda62', '3G3336*2', '', '芳草地蒸笼纸', '芳草地', '日杂', '3G3336*2', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('0ee77b59-78d8-41e6-9dd6-f30d8135be7d', '3G3337', '', '芳草地蒸笼纸', '芳草地', '日杂', '3G3337', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('0f4e63e1-20e8-4004-baaa-c2dd12de750f', '3G3338', '', '芳草地一次性筷子', '芳草地', '日杂', '3G3338', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('f6057618-2416-4e1c-aa16-a86eff9357a9', '3G3372', '', '芳草地牙签牙线组合', '芳草地', '日杂', '3G3372', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('0d8551ef-bca9-4f49-bab6-43eff76c7eca', '3G3389', '', '芳草地手套', '芳草地', '日杂', '3G3389', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('5a98af69-5d83-4e97-938b-db9d0520c18a', '3G3389*2', '', '芳草地手套', '芳草地', '日杂', '3G3389*2', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('5177a2f0-8fca-4da4-b101-a8e6de0a0b39', '3G3390', '', '芳草地手套', '芳草地', '日杂', '3G3390', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('0f971495-6edf-4dc6-be19-d83067e801e0', '3G3398', '', '芳草地蛋挞托', '芳草地', '日杂', '3G3398', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('592cc2bd-a12b-490e-9eba-b64b2c61c27e', '3G3500', '', '芳草地锡纸盘', '芳草地', '日杂', '3G3500', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('944e1506-d634-4b0a-b49a-3618ff6aa76c', '3G3501', '', '芳草地锡纸盘', '芳草地', '日杂', '3G3501', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('3d68fb2b-6e07-44a6-8a23-84583c282f8f', '3G3503', '', '芳草地垃圾袋', '芳草地', '日杂', '3G3503', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('9a68a1ba-48b4-4b72-b3cf-09db8178126d', '3G3506', '', '芳草地塑料杯', '芳草地', '塑料杯', '3G3506', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('8332ea91-185a-4742-9abe-e0c006f1855d', '3G3507', '', '芳草地塑料杯', '芳草地', '塑料杯', '3G3507', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('29d78fb7-6d60-4df5-b5c3-5908ccbd417d', '3G3508', '', '芳草地压缩洗脸巾', '芳草地', '日杂', '3G3508', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('88ac52b4-821f-4eac-ad23-8fb3eb75a6b4', '3G3510', '', '芳草地浴巾', '芳草地', '日杂', '3G3510', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('1792b2ad-be61-4e5a-92fd-eeed2a8bc5b9', '3G3511', '', '芳草地压缩浴巾', '芳草地', '日杂', '3G3511', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('c14e3f93-a964-47a3-bf4a-3c11a806ad1f', '3G3522', '', '芳草地一次性围裙', '芳草地', '日杂', '3G3522', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('b3f95d95-5e22-46bd-9aeb-4d4834efc497', '3G3542', '', '芳草地一次性马桶套', '芳草地', '日杂', '3G3542', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('d2f1a60c-7b00-4b1d-94db-e7134adad79c', '3G3545*2', '', '芳草地牙签', '芳草地', '日杂', '3G3545*2', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('06ff9b8c-6278-4140-9cae-1708bb291d3a', '3G3547*2', '', '芳草地瓶装牙签', '芳草地', '日杂', '3G3547*2', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('4c9092f0-d43a-45c4-b2ca-c8304984add6', '3G3556', '', '芳草地背心保鲜袋', '芳草地', '日杂', '3G3556', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('f116c7a2-d439-42d2-905d-ea41fd1b1630', '3G3558', '', '芳草地纸杯', '芳草地', '日杂', '3G3558', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('fd752c3b-0157-4bfd-ba6f-24859d3fd750', '3G3563*2', '', '芳草地防尘罩', '芳草地', '日杂', '3G3563*2', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('f7acbce3-a2b3-4ef3-8c0c-c09c155512ac', '3G3580', '', '芳草地保鲜膜套', '芳草地', '日杂', '3G3580', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('a11dc756-dc71-4fac-8c99-8ec405093ff2', '3G3590', '', '芳草地桌布罩', '芳草地', '日杂', '3G3590', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('73948348-3692-4e1e-835b-a0842caf8c8b', '3G3591', '', '芳草地桌布罩', '芳草地', '日杂', '3G3591', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('9e520c27-3b08-472c-abbe-10c63e2dfe00', '3G3591H', '', '芳草地桌布罩', '芳草地', '日杂', '3G3591H', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('31860a19-0841-4421-943d-001bd5a2175f', '3G3592H', '', '芳草地桌布罩', '芳草地', '日杂', '3G3592H', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('dec512d5-88b6-4541-9230-f3370f439d55', '3G3593H', '', '芳草地桌布罩', '芳草地', '日杂', '3G3593H', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('fd3903b8-fdb4-4b95-aeae-90d9b6992761', '3G3595', '', '芳草地桌布罩', '芳草地', '日杂', '3G3595', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('ddccd48f-0693-4d3b-82c8-d05924908203', '3G3751', '', '芳草地一次性筷子', '芳草地', '日杂', '3G3751', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('8e04a9b4-e323-4a83-89d2-c76d039e7daa', '3G3760', '', '芳草地保鲜膜套', '芳草地', '日杂', '3G3760', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('f2195f61-6632-4ba8-aa02-d52e1ca8c90a', '3G3761', '', '芳草地纸碗', '芳草地', '日杂', '3G3761', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('972651ac-c98d-495e-8b56-91c4589b6d72', '3G3767', '', '芳草地纸碗', '芳草地', '日杂', '3G3767', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('3a7171ea-e6f4-4232-9b60-435afd505363', '3G3769', '', '芳草地儿童手套', '芳草地', '日杂', '3G3769', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('151fe180-f5ad-4d92-9106-c9c3ef508ff2', '3G3771', '', '芳草地纸杯', '芳草地', '日杂', '3G3771', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('4e50d398-637d-486f-b0eb-d981858e754c', '3G3775', '', '芳草地纸杯', '芳草地', '日杂', '3G3775', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('70ba43de-e541-41e6-9d82-41a32f3f107d', '3G5389', '', '芳草地勺子', '芳草地', '日杂', '3G5389', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('fdc3dd42-f0c0-4d67-b126-38e45bc68d17', '3G5390', '', '芳草地勺子', '芳草地', '日杂', '3G5390', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('5a61573e-851d-4b21-8d91-998b4927a8cf', '3G5426', '', '芳草地塑料杯', '芳草地', '塑料杯', '3G5426', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('6623e2c0-8469-468f-bece-cf60b7af3c0a', '3G5433', '', '芳草地塑料杯', '芳草地', '塑料杯', '3G5433', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('d413f217-5814-4d49-8895-d0dc6e75e73b', '3G5443', '', '芳草地塑料杯', '芳草地', '塑料杯', '3G5443', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('ba285826-ad21-4a1f-a502-09e730626649', '3G5445', '', '芳草地塑料杯', '芳草地', '塑料杯', '3G5445', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('ddba523a-b5cb-40d9-805a-b6d2c5fd47f6', '3G5446', '', '芳草地塑料杯', '芳草地', '塑料杯', '3G5446', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('78558717-f60e-40c1-b27e-a7eaf7bb1ed3', '3G5448', '', '芳草地塑料碗', '芳草地', '日杂', '3G5448', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('213e9d55-e497-487b-8bf7-37bde417ec3a', '3G5458-200', '', '芳草地打包餐盒', '芳草地', '日杂', '3G5458', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('e27abb45-cb9d-4b0e-8d9a-ab408d7926e8', '3G5459', '', '芳草地勺子', '芳草地', '日杂', '3G5459', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('f8f2a37b-7077-4534-a55c-8b662b78913f', '3G5462', '', '芳草地塑料碗', '芳草地', '日杂', '3G5462', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('80971463-985e-40be-ab84-716ecbbf87c9', '3G5464', '', '芳草地纸碗', '芳草地', '日杂', '3G5464', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('3bf7bb7e-b6a2-4a0c-a3ee-3d535e199f09', '3G5480', '', '芳草地纸碗', '芳草地', '日杂', '3G5480', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('bb0ffbac-253d-4214-894f-fc3230fe9922', '3G5481', '', '芳草地纸碗', '芳草地', '日杂', '3G5481', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('082eb58c-95ca-4726-b557-1bf3098eb691', '3G5485', '', '芳草地叉子', '芳草地', '日杂', '3G5485', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('ed82f9be-ddbd-4e1e-b87b-7143e78e0939', '3G5495', '', '芳草地勺子', '芳草地', '日杂', '3G5495', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('bd8878d1-b880-4bde-abbb-b84e78ccb27a', '3G5595', '', '芳草地勺子', '芳草地', '日杂', '3G5595', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('4c6f888b-c8f6-4bb0-8bf1-c38efd6cc3b2', '3G5597', '', '芳草地吸油纸', '芳草地', '日杂', '3G5597', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('7fbf0067-ef74-496c-8d92-1108bef73d28', '3G5669', '', '芳草地一次性鞋套', '芳草地', '日杂', '3G5669', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('b5e5b29d-a062-4e5e-b637-8c66fe90074d', '3G5670*5', '', '芳草地儿童手套', '芳草地', '日杂', '3G5670*5', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('6e6d7f29-3a89-4b14-98ec-64d89e7fd118', '3G5691*20', '', '芳草地一次性筷子', '芳草地', '日杂', '3G5691*20', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('4337141d-73fb-459c-a8a1-2a0353affd30', '3G5691*36', '', '芳草地一次性筷子', '芳草地', '日杂', '3G5691*36', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('abbb09d5-b27e-4cb3-860d-0a2531317612', '3G5691*4', '', '芳草地一次性筷子', '芳草地', '日杂', '3G5691*4', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('4481859d-c183-4264-bbf7-a75cef0692e4', '3G5692', '', '芳草地烧烤竹签', '芳草地', '日杂', '3G5692', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('95fd1765-ecb5-4f48-90ae-7ef898fb5398', '3G5692+3G5777*2', '', '芳草地烧烤竹签', '芳草地', '日杂', '3G5692+3G5777*2', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('d9c53019-b826-4ce7-971e-41c653d09dca', '3G5733*2', '', '芳草地保鲜膜', '芳草地', '日杂', '3G5733*2', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('8e795c7e-bc6d-409b-a1d1-2ec52d0b183b', '3G5734*2', '', '芳草地保鲜膜', '芳草地', '日杂', '3G5734*2', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('6ed239a2-f8bb-43c0-8c8d-c0a1ff7f9565', '3G5736', '', '芳草地塑料盘', '芳草地', '日杂', '3G5736', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('28ad9f2c-c9e4-4c3a-bc92-86efa6d51573', '3G5742*6', '', '芳草地吸管', '芳草地', '日杂', '3G5742*6', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('fc94e5ce-0ab6-4fdf-81f6-3f974d7d87fb', '3G5743*5', '', '芳草地叉子', '芳草地', '日杂', '3G5743*5', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('937b9cbe-9c8b-4f89-99b8-9753f8614240', '3G5744*5', '', '芳草地勺子', '芳草地', '日杂', '3G5744*5', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('8d2de2be-7c9b-4152-bc35-f16de72c34e1', '3G5764', '', '芳草地纸杯', '芳草地', '日杂', '3G5764', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('f8c16120-ecef-4a0b-9069-ed8e23e9a9c2', '3G5767', '', '芳草地保鲜袋', '芳草地', '日杂', '3G5767', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('ada73aa7-63f3-4c63-bbe0-bbc00a6d1b6f', '3G5769', '', '芳草地纸杯', '芳草地', '日杂', '3G5769', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('72e2f38b-c281-488b-915e-12c98671ddb2', '3G5776', '', '芳草地纸杯', '芳草地', '日杂', '3G5776', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('6a2f4e6f-3a34-49ab-b73c-b30bb53bada5', '3G5777*2', '', '芳草地烧烤竹签', '芳草地', '日杂', '3G5777*2', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('bec40eeb-20f2-4356-a48b-1dd6edccfcda', '3G5778', '', '芳草地烧烤竹签', '芳草地', '日杂', '3G5778', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('5b9ef5d8-c5fa-4393-8362-45aeb2cd006a', '3G5830*2', '', '芳草地清洁刷', '', '', '3G5830*2', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('6abc05af-8969-4ea1-af9b-9f45a29cca6b', '3G5892*6', '', '芳草地棉签', '芳草地', '日杂', '3G5892*6', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('78085347-aeb9-492f-96e0-f8eaf15f3040', '3G5955厂直', '', '芳草地手套', '芳草地', '日杂', '3G5955', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('2f5a825f-c02c-4f2f-b972-15fa714a2db3', '3G5961', '', '芳草地桌布', '芳草地', '日杂', '3G5961', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('01ec5f71-32a9-402a-b1e9-8ca23ec0d946', '3G5961H', '', '芳草地桌布', '芳草地', '日杂', '3G5961H', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('a194acde-3a67-45bb-81ad-6f0fdea9ed0b', '3G5962', '', '芳草地桌布', '芳草地', '日杂', '3G5962', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('ef09a36a-3751-4dd3-8206-01cd2024b7e7', '3G5962H', '', '芳草地桌布', '芳草地', '日杂', '3G5962H', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('a398a5ee-74f3-453d-8a5c-1a848ef40120', '3G5963', '', '芳草地桌布', '芳草地', '日杂', '3G5963', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('03f4fc44-10df-44a4-a57b-b1b6519f77ad', '3G5963H', '', '芳草地桌布', '芳草地', '日杂', '3G5963H', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('861a74a0-252c-4834-844c-d64da174c0c8', '3G6000', '', '芳草地纸碗', '芳草地', '日杂', '3G6000', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('17383a3d-6a23-46b7-9a68-7f74aacc7b9a', '3G6001', '', '芳草地纸碗', '芳草地', '日杂', '3G6001', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('9f5220d6-5481-4af8-b330-ce5da95001fb', '3G6002', '', '芳草地纸碗', '芳草地', '日杂', '3G6002', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('9f3ff05f-38e0-4c87-8518-a0a0c88ae852', '3G6003', '', '芳草地纸碗', '芳草地', '日杂', '3G6003', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('f2abe4c4-adab-461d-928f-a713cbeba871', '3G6004', '', '芳草地纸碗', '芳草地', '日杂', '3G6004', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('8087700f-0182-4e8a-a5b0-dff0ae99a4ac', '3G6005', '', '芳草地纸碗', '芳草地', '日杂', '3G6005', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('6821cc2b-87a3-47e5-865e-f1fcac51821f', '3G6007', '', '芳草地塑料碗', '芳草地', '日杂', '3G6007', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('67a00bbd-9c56-4293-a278-29df4c1048eb', '3G6008', '', '芳草地打包塑料餐盒', '芳草地', '日杂', '3G6008', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('e486c0bd-61b2-4c87-89e8-979484309c24', '3G6009', '', '芳草地塑料碗', '芳草地', '日杂', '3G6009', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('8e618830-bcd3-450c-80e3-4078b3bf0f1e', '3G6010', '', '芳草地塑料碗', '芳草地', '日杂', '3G6010', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('ee3a814b-8796-4e58-8bef-fdac1da36092', '3G6011', '', '芳草地塑料碗', '芳草地', '日杂', '3G6011', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('5a641b0b-77a2-4e5d-8567-47d28574c6a3', '3G6013', '', '芳草地打包餐盒', '芳草地', '日杂', '3G6013', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();
INSERT INTO products (id, sku, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at)
VALUES ('93596a1e-fddb-4331-bed4-4af139e537a9', '3G6014', '', '芳草地打包塑料餐盒', '芳草地', '日杂', '3G6014', 'pcs', 0, 0, '在售', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    spec = EXCLUDED.spec,
    updated_at = NOW();

-- 导入订单数据
INSERT INTO orders (id, order_no, supplier_order_no, status, items, receiver_name, receiver_phone, receiver_address, province, city, district, customer_code, customer_name, salesperson, supplier_id, supplier_name, express_company, tracking_no, source, import_batch, assigned_batch, match_code, remark, express_requirement, created_at, updated_at)
VALUES ('77898c48-82e8-4ee6-bbee-0a41671178f1', 'ORD广州8字0001', '', 'pending', '[{"product_name": "\u82cf\u6cca\u5c14\u7535\u5439\u98ceEHDH-H820B\uff08\u65e0\u98ce\u5634\u6b3e\uff09", "product_spec": "", "quantity": 1}]', '邱美均', '18620917926', '广东省广州市黄埔区黄埔东路丹水坑路万科尚城A6栋3001', '广东省', '广州市', '黄埔区黄埔东路丹水坑路万科尚城A6栋30', '', '', '', '', '', '', '', '广州8字', '', '', '', '', '', NOW(), NOW())
ON CONFLICT (order_no) DO UPDATE SET 
    items = EXCLUDED.items,
    receiver_name = EXCLUDED.receiver_name,
    receiver_phone = EXCLUDED.receiver_phone,
    receiver_address = EXCLUDED.receiver_address,
    province = EXCLUDED.province,
    city = EXCLUDED.city,
    district = EXCLUDED.district,
    updated_at = NOW();
INSERT INTO orders (id, order_no, supplier_order_no, status, items, receiver_name, receiver_phone, receiver_address, province, city, district, customer_code, customer_name, salesperson, supplier_id, supplier_name, express_company, tracking_no, source, import_batch, assigned_batch, match_code, remark, express_requirement, created_at, updated_at)
VALUES ('3f083df5-76f9-4452-9ac7-0c29fc2ad5e4', 'KY_415_17747913908879', '', 'pending', '[{"product_name": "\u82cf\u6cca\u5c14 \u6297\u83cc\u4e0d\u7c98\u7092\u9505 VC32SP05", "product_spec": "VC32SP05", "quantity": 1}]', '席', '18724144902', '山西太原杏花岭区杨家峪街道千度东山晴4期', '', '', '', '', '', '', '', '', '', '', '杭州启诚', '', '', '', '', '', NOW(), NOW())
ON CONFLICT (order_no) DO UPDATE SET 
    items = EXCLUDED.items,
    receiver_name = EXCLUDED.receiver_name,
    receiver_phone = EXCLUDED.receiver_phone,
    receiver_address = EXCLUDED.receiver_address,
    province = EXCLUDED.province,
    city = EXCLUDED.city,
    district = EXCLUDED.district,
    updated_at = NOW();
INSERT INTO orders (id, order_no, supplier_order_no, status, items, receiver_name, receiver_phone, receiver_address, province, city, district, customer_code, customer_name, salesperson, supplier_id, supplier_name, express_company, tracking_no, source, import_batch, assigned_batch, match_code, remark, express_requirement, created_at, updated_at)
VALUES ('f010b822-03e1-4a13-8eba-5962c28e1165', 'KY_415_17747654241505', '', 'pending', '[{"product_name": "\u82cf\u6cca\u5c14 \u6302\u70eb\u673a GU-401C", "product_spec": "GU-401C", "quantity": 1}]', '吴女士', '13574100425', '湖南长沙岳麓区阳光100，74栋', '', '', '', '', '', '', '', '', '', '', '杭州启诚', '', '', '', '', '', NOW(), NOW())
ON CONFLICT (order_no) DO UPDATE SET 
    items = EXCLUDED.items,
    receiver_name = EXCLUDED.receiver_name,
    receiver_phone = EXCLUDED.receiver_phone,
    receiver_address = EXCLUDED.receiver_address,
    province = EXCLUDED.province,
    city = EXCLUDED.city,
    district = EXCLUDED.district,
    updated_at = NOW();
INSERT INTO orders (id, order_no, supplier_order_no, status, items, receiver_name, receiver_phone, receiver_address, province, city, district, customer_code, customer_name, salesperson, supplier_id, supplier_name, express_company, tracking_no, source, import_batch, assigned_batch, match_code, remark, express_requirement, created_at, updated_at)
VALUES ('268f1908-e087-402a-a0be-1a9490800c15', 'KY_415_45_17747314167288', '', 'pending', '[{"product_name": "\u82cf\u6cca\u5c14\u7535\u996d\u7172SF40FC375", "product_spec": "SF40FC375", "quantity": 1}]', '徐俊', '15179317429', '江西上饶信州区江西省上饶市广信区 一舟大道与江铜东大道交叉口西南320米江铜华东工业园新公寓', '江西上饶信州区江西省', '上饶市', '广信区 一舟大道与江铜东大道交叉口西南3', '', '', '', '', '', '', '', '杭州启诚', '', '', '', '', '', NOW(), NOW())
ON CONFLICT (order_no) DO UPDATE SET 
    items = EXCLUDED.items,
    receiver_name = EXCLUDED.receiver_name,
    receiver_phone = EXCLUDED.receiver_phone,
    receiver_address = EXCLUDED.receiver_address,
    province = EXCLUDED.province,
    city = EXCLUDED.city,
    district = EXCLUDED.district,
    updated_at = NOW();
INSERT INTO orders (id, order_no, supplier_order_no, status, items, receiver_name, receiver_phone, receiver_address, province, city, district, customer_code, customer_name, salesperson, supplier_id, supplier_name, express_company, tracking_no, source, import_batch, assigned_batch, match_code, remark, express_requirement, created_at, updated_at)
VALUES ('849fb047-3ccd-4f6b-85e1-1f9aabef1e77', 'KY_415_17747062231542', '', 'pending', '[{"product_name": "\u82cf\u6cca\u5c14\uff08SUPOR\uff09\u9ad8\u538b\u9505304\u4e0d\u9508\u94a2\u5bb6\u7528\u538b\u529b\u9505 YW203JA1", "product_spec": "YW203JA1", "quantity": 1}]', '璐璐', '15898527269', '湖南长沙雨花区博远西苑5栋', '', '', '', '', '', '', '', '', '', '', '杭州启诚', '', '', '', '', '', NOW(), NOW())
ON CONFLICT (order_no) DO UPDATE SET 
    items = EXCLUDED.items,
    receiver_name = EXCLUDED.receiver_name,
    receiver_phone = EXCLUDED.receiver_phone,
    receiver_address = EXCLUDED.receiver_address,
    province = EXCLUDED.province,
    city = EXCLUDED.city,
    district = EXCLUDED.district,
    updated_at = NOW();
INSERT INTO orders (id, order_no, supplier_order_no, status, items, receiver_name, receiver_phone, receiver_address, province, city, district, customer_code, customer_name, salesperson, supplier_id, supplier_name, express_company, tracking_no, source, import_batch, assigned_batch, match_code, remark, express_requirement, created_at, updated_at)
VALUES ('5b666950-7649-48a2-bc94-e031e2114a4f', 'KY_415_17746993944469', '', 'pending', '[{"product_name": "\u82cf\u6cca\u5c14 \u4fdd\u6e29\u58f6 TKC200KH53", "product_spec": "TKC200KH53", "quantity": 1}]', '蒋帆', '18952986990', '江苏镇江扬中市扬中市建宁路59号', '', '江苏镇江扬中市', '扬中', '', '', '', '', '', '', '', '杭州启诚', '', '', '', '', '', NOW(), NOW())
ON CONFLICT (order_no) DO UPDATE SET 
    items = EXCLUDED.items,
    receiver_name = EXCLUDED.receiver_name,
    receiver_phone = EXCLUDED.receiver_phone,
    receiver_address = EXCLUDED.receiver_address,
    province = EXCLUDED.province,
    city = EXCLUDED.city,
    district = EXCLUDED.district,
    updated_at = NOW();
INSERT INTO orders (id, order_no, supplier_order_no, status, items, receiver_name, receiver_phone, receiver_address, province, city, district, customer_code, customer_name, salesperson, supplier_id, supplier_name, express_company, tracking_no, source, import_batch, assigned_batch, match_code, remark, express_requirement, created_at, updated_at)
VALUES ('e97e8de6-efc7-4ba9-bbf2-3c9a3242b262', 'wx769606111115345920', '', 'pending', '[{"product_name": "\u82cf\u6cca\u5c14\uff08SUPOR\uff09 \u76f4\u996e\u6ce1\u996e\u4fdd\u6e29\u676f\u4fdd\u6e29\u4fdd\u51b7\u5496\u5561\u676f316L\u4e0d\u9508\u94a2\u7537\u5973\u989c\u503c\u6c34\u676fKCV50DW10 \u9ed1", "product_spec": "", "quantity": 1}]', '许海冬', '18686200333', '内蒙古自治区 锡林郭勒盟 东乌珠穆沁旗 乌里雅斯太镇 纳兰商务酒店', '', '', '', '', '', '', '', '', '', '', '杭州启诚', '', '', '', '', '', NOW(), NOW())
ON CONFLICT (order_no) DO UPDATE SET 
    items = EXCLUDED.items,
    receiver_name = EXCLUDED.receiver_name,
    receiver_phone = EXCLUDED.receiver_phone,
    receiver_address = EXCLUDED.receiver_address,
    province = EXCLUDED.province,
    city = EXCLUDED.city,
    district = EXCLUDED.district,
    updated_at = NOW();
INSERT INTO orders (id, order_no, supplier_order_no, status, items, receiver_name, receiver_phone, receiver_address, province, city, district, customer_code, customer_name, salesperson, supplier_id, supplier_name, express_company, tracking_no, source, import_batch, assigned_batch, match_code, remark, express_requirement, created_at, updated_at)
VALUES ('6584d4e4-1ab9-4bec-a6f8-90f599beafb9', 'SXZ-10A1BD1AC990A000EF', '', 'pending', '[{"product_name": "\u82cf\u6cca\u5c14 \u81fb\u706b\u8702\u7a9d32cm\u94c1\u9505 VC32RF01", "product_spec": "", "quantity": 1}]', '聂金娥', '18757294343', '浙江省湖州市吴兴区织里镇 迎春路138号', '浙江省', '湖州市', '吴兴区织里镇 迎春路138号', '', '', '', '', '', '', ''202603300932168789', '迅派', '', '', '', '', '', NOW(), NOW())
ON CONFLICT (order_no) DO UPDATE SET 
    items = EXCLUDED.items,
    receiver_name = EXCLUDED.receiver_name,
    receiver_phone = EXCLUDED.receiver_phone,
    receiver_address = EXCLUDED.receiver_address,
    province = EXCLUDED.province,
    city = EXCLUDED.city,
    district = EXCLUDED.district,
    updated_at = NOW();
INSERT INTO orders (id, order_no, supplier_order_no, status, items, receiver_name, receiver_phone, receiver_address, province, city, district, customer_code, customer_name, salesperson, supplier_id, supplier_name, express_company, tracking_no, source, import_batch, assigned_batch, match_code, remark, express_requirement, created_at, updated_at)
VALUES ('526df0b6-5460-46e6-b79e-e7d2eac27f2d', 'SXZ-10A1BD1AD2D0A000B4', '', 'pending', '[{"product_name": "\u4e5d\u9633 \u517b\u751f\u58f6\u7535\u6c34\u58f6 K15D-WY669DK", "product_spec": "", "quantity": 1}]', '马依铭', '18604163949', '辽宁省锦州市凌河区锦铁街道 白日南里30 68', '辽宁省', '锦州市', '凌河区锦铁街道 白日南里30 68', '', '', '', '', '', '', ''202603290854525892', '迅派', '', '', '', '', '', NOW(), NOW())
ON CONFLICT (order_no) DO UPDATE SET 
    items = EXCLUDED.items,
    receiver_name = EXCLUDED.receiver_name,
    receiver_phone = EXCLUDED.receiver_phone,
    receiver_address = EXCLUDED.receiver_address,
    province = EXCLUDED.province,
    city = EXCLUDED.city,
    district = EXCLUDED.district,
    updated_at = NOW();
INSERT INTO orders (id, order_no, supplier_order_no, status, items, receiver_name, receiver_phone, receiver_address, province, city, district, customer_code, customer_name, salesperson, supplier_id, supplier_name, express_company, tracking_no, source, import_batch, assigned_batch, match_code, remark, express_requirement, created_at, updated_at)
VALUES ('c7474b70-d48f-40d3-83ab-faa7cc0b95cc', 'SXZ-10A1BD1AD2D0A001B5', '', 'pending', '[{"product_name": "\u4e5d\u9633 \u517b\u751f\u58f6\u7535\u6c34\u58f6 K15D-WY669DK", "product_spec": "", "quantity": 1}]', '杜海洋', '13598218880', '河南省南阳市宛城区枣林街道 枣林菜市场北门海洋干菜粮油行', '河南省', '南阳市', '宛城区枣林街道 枣林菜', '', '', '', '', '', '', ''202603291758264385', '迅派', '', '', '', '', '', NOW(), NOW())
ON CONFLICT (order_no) DO UPDATE SET 
    items = EXCLUDED.items,
    receiver_name = EXCLUDED.receiver_name,
    receiver_phone = EXCLUDED.receiver_phone,
    receiver_address = EXCLUDED.receiver_address,
    province = EXCLUDED.province,
    city = EXCLUDED.city,
    district = EXCLUDED.district,
    updated_at = NOW();
INSERT INTO orders (id, order_no, supplier_order_no, status, items, receiver_name, receiver_phone, receiver_address, province, city, district, customer_code, customer_name, salesperson, supplier_id, supplier_name, express_company, tracking_no, source, import_batch, assigned_batch, match_code, remark, express_requirement, created_at, updated_at)
VALUES ('c6e92242-3c75-4ec0-b3ef-5f4ab4f285f7', 'SXZ-10A1BD1AD2D0A002B6', '', 'pending', '[{"product_name": "\u4e5d\u9633 \u7a7a\u6c14\u70b8\u9505 KL50-J661", "product_spec": "", "quantity": 1}]', '宋凤华', '13945866131', '黑龙江省鸡西市密山市密山镇 晨曲街 书香文苑小区 二单元2201室', '黑龙江省', '鸡西市', '密山', '', '', '', '', '', '', ''202603291243324587', '迅派', '', '', '', '', '', NOW(), NOW())
ON CONFLICT (order_no) DO UPDATE SET 
    items = EXCLUDED.items,
    receiver_name = EXCLUDED.receiver_name,
    receiver_phone = EXCLUDED.receiver_phone,
    receiver_address = EXCLUDED.receiver_address,
    province = EXCLUDED.province,
    city = EXCLUDED.city,
    district = EXCLUDED.district,
    updated_at = NOW();
INSERT INTO orders (id, order_no, supplier_order_no, status, items, receiver_name, receiver_phone, receiver_address, province, city, district, customer_code, customer_name, salesperson, supplier_id, supplier_name, express_company, tracking_no, source, import_batch, assigned_batch, match_code, remark, express_requirement, created_at, updated_at)
VALUES ('15e47fb1-214b-4993-8ca6-b5e23c9f59ea', 'SXZ-10A1BD1AD310A00075', '', 'pending', '[{"product_name": "\u4e5d\u9633 \u5927\u5bb9\u91cf\u7535\u538b\u529b\u9505 Y-60S32", "product_spec": "", "quantity": 1}]', '廖小霞', '13646047393', '福建省漳州市芗城区西桥街道 漳州市芗城区琥珀岭矿务局干休所', '福建省', '漳州市', '芗城区西桥街道 漳州', '', '', '', '', '', '', ''202603291217408817', '迅派', '', '', '', '', '', NOW(), NOW())
ON CONFLICT (order_no) DO UPDATE SET 
    items = EXCLUDED.items,
    receiver_name = EXCLUDED.receiver_name,
    receiver_phone = EXCLUDED.receiver_phone,
    receiver_address = EXCLUDED.receiver_address,
    province = EXCLUDED.province,
    city = EXCLUDED.city,
    district = EXCLUDED.district,
    updated_at = NOW();
INSERT INTO orders (id, order_no, supplier_order_no, status, items, receiver_name, receiver_phone, receiver_address, province, city, district, customer_code, customer_name, salesperson, supplier_id, supplier_name, express_company, tracking_no, source, import_batch, assigned_batch, match_code, remark, express_requirement, created_at, updated_at)
VALUES ('aba5f815-0312-4bff-b14e-3a70f1765ee0', 'SXZ-10A1BD1AD350A00035', '', 'pending', '[{"product_name": "\u4e5d\u9633 \u7535\u996d\u7172 F30FY-F585", "product_spec": "", "quantity": 1}]', '老刘', '13955823416', '安徽省亳州市利辛县城关镇 建设南路金宝贝幼儿园南200米路西修水箱处', '安徽省', '亳州市', '利辛县城关镇 建设南路金宝贝幼儿园南20', '', '', '', '', '', '', ''202603281510489244', '迅派', '', '', '', '', '', NOW(), NOW())
ON CONFLICT (order_no) DO UPDATE SET 
    items = EXCLUDED.items,
    receiver_name = EXCLUDED.receiver_name,
    receiver_phone = EXCLUDED.receiver_phone,
    receiver_address = EXCLUDED.receiver_address,
    province = EXCLUDED.province,
    city = EXCLUDED.city,
    district = EXCLUDED.district,
    updated_at = NOW();
INSERT INTO orders (id, order_no, supplier_order_no, status, items, receiver_name, receiver_phone, receiver_address, province, city, district, customer_code, customer_name, salesperson, supplier_id, supplier_name, express_company, tracking_no, source, import_batch, assigned_batch, match_code, remark, express_requirement, created_at, updated_at)
VALUES ('81a103bc-2a64-4d9f-9810-9f7357344d00', 'SXZ-10A1BD1AD350A00134', '', 'pending', '[{"product_name": "\u4e5d\u9633 \u7535\u996d\u7172 F30FY-F585", "product_spec": "", "quantity": 1}]', '朱杉杉', '18633121117', '河北省唐山市路南区文化北后街街道 荷花坑市场B座3号', '河北省', '唐山市', '路南区文化北后街街道 荷花坑', '', '', '', '', '', '', ''202603301032275265', '迅派', '', '', '', '', '', NOW(), NOW())
ON CONFLICT (order_no) DO UPDATE SET 
    items = EXCLUDED.items,
    receiver_name = EXCLUDED.receiver_name,
    receiver_phone = EXCLUDED.receiver_phone,
    receiver_address = EXCLUDED.receiver_address,
    province = EXCLUDED.province,
    city = EXCLUDED.city,
    district = EXCLUDED.district,
    updated_at = NOW();
INSERT INTO orders (id, order_no, supplier_order_no, status, items, receiver_name, receiver_phone, receiver_address, province, city, district, customer_code, customer_name, salesperson, supplier_id, supplier_name, express_company, tracking_no, source, import_batch, assigned_batch, match_code, remark, express_requirement, created_at, updated_at)
VALUES ('c0907f20-9393-4b8e-b5ed-d19c110b5d85', '100046395702', '', 'pending', '[{"product_name": "\u82cf\u6cca\u5c14(SUPOR) \u7535\u716e\u95051.2L \u5355\u4eba\u7535\u706b\u9505\u4e0d\u6cbe\u5185\u9505 \u84b8\u7096\u716e\u6dae \u6781\u7b80\u65cb\u94ae2\u6863\u706b\u529b H12YK29", "product_spec": "", "quantity": 1}]', '李女士', '15637113568', '河南省郑州市金水区全区文化路45号三号楼三单元三楼东', '河南省', '郑州市', '金水区全区文化路45号三号楼三单元三楼东', '', '', '', '', '', '', '', '极光-苏泊尔', '', '', '', '', '', NOW(), NOW())
ON CONFLICT (order_no) DO UPDATE SET 
    items = EXCLUDED.items,
    receiver_name = EXCLUDED.receiver_name,
    receiver_phone = EXCLUDED.receiver_phone,
    receiver_address = EXCLUDED.receiver_address,
    province = EXCLUDED.province,
    city = EXCLUDED.city,
    district = EXCLUDED.district,
    updated_at = NOW();
INSERT INTO orders (id, order_no, supplier_order_no, status, items, receiver_name, receiver_phone, receiver_address, province, city, district, customer_code, customer_name, salesperson, supplier_id, supplier_name, express_company, tracking_no, source, import_batch, assigned_batch, match_code, remark, express_requirement, created_at, updated_at)
VALUES ('d93e902a-d4bc-4843-bce9-b3af19b28f7d', '100046400511', '', 'pending', '[{"product_name": "\u82cf\u6cca\u5c14(SUPOR) \u7116\u70e7\u676f KC50KZ10 \u7eff\u8272", "product_spec": "", "quantity": 1}]', '琪琪', '13986231552', '北京市北京市通州区九棵树街道新城阳光37号楼三单元321', '', '北京市', '北京', '', '', '', '', '', '', '', '极光-苏泊尔', '', '', '', '', '', NOW(), NOW())
ON CONFLICT (order_no) DO UPDATE SET 
    items = EXCLUDED.items,
    receiver_name = EXCLUDED.receiver_name,
    receiver_phone = EXCLUDED.receiver_phone,
    receiver_address = EXCLUDED.receiver_address,
    province = EXCLUDED.province,
    city = EXCLUDED.city,
    district = EXCLUDED.district,
    updated_at = NOW();
INSERT INTO orders (id, order_no, supplier_order_no, status, items, receiver_name, receiver_phone, receiver_address, province, city, district, customer_code, customer_name, salesperson, supplier_id, supplier_name, express_company, tracking_no, source, import_batch, assigned_batch, match_code, remark, express_requirement, created_at, updated_at)
VALUES ('2e091a9f-96c6-449d-9428-9ca449c23e0d', '1197091148152217600', '', 'pending', '[{"product_name": "\u82cf\u6cca\u5c14 4\u5347\u94dc\u6676\u7403\u91dc\u5185\u80c6\u7535\u996d\u7172 \u667a\u80fd\u9884\u7ea6 \u4e0d\u7c98\u9505\u591a\u529f\u80fd SF40HC0028", "product_spec": "\u89c4\u683c:4\u5347", "quantity": 1}]', '侯建东', '17793233918', '北京北京市昌平区城南街道北京市昌平区昌盛路26号F2楼二层快递收纳处', '', '北京北京市', '昌平区城南街道北京', '', '', '', '', '', '', '', '苏泊尔-龙禹', '', '', '', '', '', NOW(), NOW())
ON CONFLICT (order_no) DO UPDATE SET 
    items = EXCLUDED.items,
    receiver_name = EXCLUDED.receiver_name,
    receiver_phone = EXCLUDED.receiver_phone,
    receiver_address = EXCLUDED.receiver_address,
    province = EXCLUDED.province,
    city = EXCLUDED.city,
    district = EXCLUDED.district,
    updated_at = NOW();