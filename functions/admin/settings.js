// /functions/admin/settings.js
export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const { allow_trial, trial_duration_days, app_entry_password, software_share_url } = await request.json();
        
        await env.DB.prepare("INSERT OR REPLACE INTO app_settings (setting_key, setting_value) VALUES ('allow_trial', ?)").bind(allow_trial).run();
        await env.DB.prepare("INSERT OR REPLACE INTO app_settings (setting_key, setting_value) VALUES ('trial_duration_days', ?)").bind(trial_duration_days).run();
        await env.DB.prepare("INSERT OR REPLACE INTO app_settings (setting_key, setting_value) VALUES ('app_entry_password', ?)").bind(app_entry_password).run();
        await env.DB.prepare("INSERT OR REPLACE INTO app_settings (setting_key, setting_value) VALUES ('software_share_url', ?)").bind(software_share_url).run();

        return new Response(JSON.stringify({ status: "success", message: "配置已保存" }));
    } catch (error) {
        return new Response(JSON.stringify({ status: "error", message: "保存失败" }), { status: 500 });
    }
}

export async function onRequestGet(context) {
    try {
        const { env } = context;
        const settings = await env.DB.prepare("SELECT setting_key, setting_value FROM app_settings").all();
        const settingsObj = {};
        settings.results.forEach(s => {
            settingsObj[s.setting_key] = s.setting_value;
        });
        return new Response(JSON.stringify({ status: "success", settings: settingsObj }));
    } catch (error) {
        return new Response(JSON.stringify({ status: "error", message: "获取配置失败" }), { status: 500 });
    }
}
