// /functions/api/get-announcements.js
export async function onRequestGet(context) {
    try {
        const { env } = context;
        const announcements = await env.DB.prepare("SELECT * FROM announcements WHERE is_active = 1 ORDER BY created_at DESC").all();
        return new Response(JSON.stringify({ status: "success", announcements: announcements.results }));
    } catch (error) {
        return new Response(JSON.stringify({ status: "error", message: "获取公告失败" }), { status: 500 });
    }
}
