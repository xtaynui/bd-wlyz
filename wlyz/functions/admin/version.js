// /functions/admin/version.js
export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const { version_name, version_code, download_url, update_log, is_force_update } = await request.json();
        if (!version_name || !version_code || !download_url) {
            return new Response(JSON.stringify({ status: "error", message: "版本名、版本号和下载链接不能为空" }), { status: 400 });
        }
        await env.DB.prepare(
            "INSERT INTO app_versions (version_name, version_code, download_url, update_log, is_force_update) VALUES (?, ?, ?, ?, ?)"
        ).bind(version_name, parseInt(version_code), download_url, update_log, is_force_update ? 1 : 0).run();
        return new Response(JSON.stringify({ status: "success", message: "版本发布成功" }));
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return new Response(JSON.stringify({ status: "error", message: "版本号已存在" }), { status: 400 });
        }
        return new Response(JSON.stringify({ status: "error", message: "发布失败" }), { status: 500 });
    }
}
