BEGIN;
CREATE EXTENSION "basejump-supabase_test_helpers";

SELECT plan(7);


SELECT tests.authenticate_as('test_user');
-- Test exist_app_v2
SELECT is(exist_app_v2('com.demo.app'), true, 'exist_app_v2 test - app exists');
SELECT is(exist_app_v2('non_existent_app'), false, 'exist_app_v2 test - app does not exist');
SELECT tests.clear_authentication();

-- Test exist_app_versions
SELECT tests.authenticate_as('test_user');
SELECT is(exist_app_versions('com.demo.app', '1.0.0', 'ae4d9a98-ec25-4af8-933c-2aae4aa52b85'), true, 'exist_app_versions test - version exists');
SELECT is(exist_app_versions('com.demo.app', 'non_existent_version', 'ae4d9a98-ec25-4af8-933c-2aae4aa52b85'), false, 'exist_app_versions test - version does not exist');
SELECT tests.clear_authentication();

-- Test get_app_versions
SELECT tests.authenticate_as('test_user');
SELECT is(get_user_id('ae6e7458-c46d-4c00-aa3b-153b0b8520ea', 'com.demo.app'), '6aa76066-55ef-4238-ade6-0b32334a4097', 'get_user_id test - user exists');
SELECT is(get_app_versions('com.demo.app', '1.0.0', 'ae6e7458-c46d-4c00-aa3b-153b0b8520ea'), 9654, 'get_app_versions test - version exists');
SELECT is(get_app_versions('com.demo.app', 'non_existent_version', 'ae4d9a98-ec25-4af8-933c-2aae4aa52b85'), NULL, 'get_app_versions test - version does not exist');
SELECT tests.clear_authentication();

SELECT * FROM finish();
ROLLBACK;
