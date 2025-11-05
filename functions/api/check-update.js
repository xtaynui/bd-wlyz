// /functions/api/check-update.js
export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const { current_version_code } = await request.json();
        if (!current_version_code) {
            return new Response(JSON.stringify({ status: "error", message: "请提供当前版本号" }), { status: 400 });
        }
        const latestVersion = await env.DB.prepare("SELECT * FROM app_versions ORDER BY version_code DESC LIMIT 1").first();
        if (!latestVersion) {
            return new Response(JSON.stringify({ status: "error", message: "暂无版本信息" }));
        }
        const needsUpdate = latestVersion.version_code > current_version_code;
        const isForceUpdate = needsUpdate && latestVersion.is_force_update === 1;
        return new Response(JSON.stringify({ status: "success", needs_update, is_force_update, latest_version: latestVersion }));
    } catch (error) {
        return new Response(JSON.stringify({ status: "error", message: "检查更新失败" }), { status: 500 });
    }
}
