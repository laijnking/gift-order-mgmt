-- ============================================================
-- 修复 shippers 表缺失的 province 和 city 字段
-- 运行方式: psql $DATABASE_URL -f supabase/migrations/fix_shippers_province.sql
-- ============================================================

DO $$
BEGIN
    -- 添加 province 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'shippers'
          AND column_name = 'province'
    ) THEN
        ALTER TABLE shippers ADD COLUMN province VARCHAR(50);
        RAISE NOTICE 'shippers.province 字段已添加';
    ELSE
        RAISE NOTICE 'shippers.province 字段已存在，跳过';
    END IF;

    -- 添加 city 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'shippers'
          AND column_name = 'city'
    ) THEN
        ALTER TABLE shippers ADD COLUMN city VARCHAR(50);
        RAISE NOTICE 'shippers.city 字段已添加';
    ELSE
        RAISE NOTICE 'shippers.city 字段已存在，跳过';
    END IF;

    -- 迁移 region -> province（如果 region 有值且 province 为空）
    EXECUTE 'UPDATE shippers SET province = region
             WHERE region IS NOT NULL
               AND region <> ''''
               AND (province IS NULL OR province = '''')' ;
    RAISE NOTICE 'region -> province 数据迁移完成';

    -- 迁移 contact -> contact_person
    EXECUTE "UPDATE shippers SET contact_person = contact
             WHERE contact IS NOT NULL
               AND contact <> ''
               AND (contact_person IS NULL OR contact_person = '')" ;
    RAISE NOTICE 'contact -> contact_person 数据迁移完成';

    -- 迁移 phone -> contact_phone
    EXECUTE 'UPDATE shippers SET contact_phone = phone
             WHERE phone IS NOT NULL
               AND phone <> ''''
               AND (contact_phone IS NULL OR contact_phone = '''')' ;
    RAISE NOTICE 'phone -> contact_phone 数据迁移完成';

END $$;
