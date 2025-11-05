// /functions/admin/logs.js
export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const { search_type, search_value, page = 1, limit = 20 } = await request.json();
        const offset = (page - 1) * limit;

        let whereClause = "";
        let bindParam = [];

        if (search_type && search_value) {
            if (search_type === 'card_key') {
                whereClause = "WHERE card_key = ?";
            } else if (search_type === 'device_id') {
                whereClause = "WHERE device_id = ?";
            }
            bindParam.push(search_value);
        }

        const logs = await env.DB.prepare(
            `SELECT * FROM usage_logs ${whereClause} ORDER BY validated_at DESC LIMIT ? OFFSET ?`
        ).bind(...bindParam, limit, offset).all();

        const countResult = await env.DB.prepare(`SELECT COUNT(*) as total FROM usage_logs ${whereClause}`).bind(...bindParam).first();

        return new Response(JSON.stringify({
            status: "success",
            logs: logs.results,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult.total,
                totalPages: Math.ceil(countResult.total / limit)
            }
        }));

    } catch (error) {
        return new Response(JSON.stringify({ status: "error", message: "查询失败" }), { status: 500 });
    }
}
