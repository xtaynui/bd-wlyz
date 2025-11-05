// /functions/admin/announcement.js
export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const { title, content } = await request.json();
        if (!title || !content) {
            return new Response(JSON.stringify({ status: "error", message: "标题和内容不能为空" }), { status: 400 });
        }
        await env.DB.prepare("INSERT INTO announcements (title, content) VALUES (?, ?)").bind(title, content).run();
        return new Response(JSON.stringify({ status: "success", message: "公告发布成功" }));
    } catch (error) {
        return new Response(JSON.stringify({ status: "error", message: "发布失败" }), { status: 500 });
    }
}
