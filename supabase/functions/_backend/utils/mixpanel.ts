import type { Context } from '@hono/hono'
import Mixpanel from "mixpanel"
import { supabaseAdmin } from './supabase.ts';

const Token = "e9d2d9d462a6493dfb535a71a4689f67";
var mixpanel = Mixpanel.init(Token);

export const sendMixpanelStudentEvent = async (
    context: Context,
    event_name: string,
    params: any = {},
) => {
    if ([
        'download_10',
        'download_20',
        'download_30',
        'download_40',
        'download_50',
        'download_60',
        'download_70',
        'download_80',
        'download_90',
    ].includes(event_name)) {
        return;
    }
    if (!params.device_id) return;
    const { data: deviceInfo } = await supabaseAdmin(context)
        .from('devices')
        .select('device_id, custom_id')
        .eq('device_id', params.device_id)
        .single()

    if (!deviceInfo?.custom_id) return;
    const eventBody = {
        distinct_id: deviceInfo?.custom_id,

        ...params,
        triggered_via: "capgo_backend",
    };
    if (params.version_id || params.version) {
        const { data: versionInfo } = await supabaseAdmin(context)
            .from('app_versions')
            .select('id, name')
            .eq('id', params.version_id || params.version)
            .single()
        eventBody['version_name'] = versionInfo?.name
    }
    const camelToSnakeCase = (str: any) => str.replace(/[A-Z]/g, (letter: any) => `_${letter.toLowerCase()}`);
    mixpanel.track(camelToSnakeCase(event_name), eventBody);
    console.log("🚀 ~ track:", camelToSnakeCase(event_name), deviceInfo?.custom_id)
};
