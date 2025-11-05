// /functions/admin/manage.js
export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const { action, card_key, new_expiry, device_id, reason } = await request.json();
        let result;

        if (action === 'unbind') {
            result = await env.DB.prepare("UPDATE bindings SET device_id = NULL, bind_date = 0 WHERE card_key = ?").bind(card_key).run();
            if (result.changes > 0) return new Response(JSON.stringify({ status: "success", message: "设备解绑成功" }));
        } else if (action === 'delete') {
            result = await env.DB.prepare("DELETE FROM bindings WHERE card_key = ?").bind(card_key).run();
            if (result.changes > 0) return new Response(JSON.stringify({ status: "success", message: "卡密删除成功" }));
        } else if (action === 'update_expiry') {
            result = await env.DB.prepare("UPDATE bindings SET expiry_date = ? WHERE card_key = ?").bind(new_expiry, card_key).run();
            if (result.changes > 0) return new Response(JSON.stringify({ status: "success", message: "到期时间修改成功" }));
        } else if (action === 'extend_card') { // 新增：延长时长
            const daysToAdd = parseInt(new_expiry);
            const currentExpiry = await env.DB.prepare("SELECT expiry_date FROM bindings WHERE card_key = ?").bind(card_key).first();
            if (currentExpiry) {
                const newDate = new Date(currentExpiry.expiry_date);
                newDate.setDate(newDate.getDate() + daysToAdd);
                result = await env.DB.prepare("UPDATE bindings SET expiry_date = ? WHERE card_key = ?").bind(newDate.toISOString().split('T')[0], card_key).run();
                if (result.changes > 0) return new Response(JSON.stringify({ status: "success", message: `卡密已延长 ${daysToAdd} 天` }));
            }
        } else if (action === 'pause_card') {
            result = await env.DB.prepare("UPDATE bindings SET status = 'paused' WHERE card_key = ?").bind(card_key).run();
            if (result.changes > 0) return new Response(JSON.stringify({ status: "success", message: "卡密已暂停" }));
        } else if (action === 'activate_card') {
            result = await env.DB.prepare("UPDATE bindings SET status = 'active' WHERE card_key = ?").bind(card_key).run();
            if (result.changes > 0) return new Response(JSON.stringify({ status: "success", message: "卡密已激活" }));
        } else if (action === 'ban_device') {
            await env.DB.prepare("INSERT OR REPLACE INTO banned_devices (device_id, reason) VALUES (?, ?)").bind(device_id, reason).run();
            return new Response(JSON.stringify({ status: "success", message: "设备已封禁" }));
        } else if (action === 'unban_device') {
            result = await env.DB.prepare("DELETE FROM banned_devices WHERE device_id = ?").bind(device_id).run();
            if (result.changes > 0) return new Response(JSON.stringify({ status: "success", message: "设备已解封" }));
        }

        return new Response(JSON.stringify({ status: "error", message: "操作失败，请检查输入是否正确" }));

    } catch (error) {
        return new Response(JSON.stringify({ status: "error", message: "服务器内部错误" }), { status: 500 });
    }
}
