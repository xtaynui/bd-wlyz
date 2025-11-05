// /functions/api/validate.js
export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const { card_key, device_id } = await request.json();

        if (!card_key || !device_id) {
            return new Response(JSON.stringify({ status: "error", message: "参数不完整" }), { status: 400 });
        }

        // 0. 检查设备是否被封禁
        const isBanned = await env.DB.prepare("SELECT id FROM banned_devices WHERE device_id = ?").bind(device_id).first();
        if (isBanned) {
            return new Response(JSON.stringify({ status: "error", message: "设备已被封禁" }));
        }

        // 1. 查询卡密
        const cardInfo = await env.DB.prepare(
            "SELECT device_id, bind_date, expiry_date, status FROM bindings WHERE card_key = ?"
        ).bind(card_key).first();

        if (!cardInfo) {
            // 卡密不存在，检查是否允许试用
            const trialSetting = await env.DB.prepare("SELECT setting_value FROM app_settings WHERE setting_key = 'allow_trial'").first();
            if (trialSetting && trialSetting.setting_value === 'true') {
                const trialDurationSetting = await env.DB.prepare("SELECT setting_value FROM app_settings WHERE setting_key = 'trial_duration_days'").first();
                const trialDays = parseInt(trialDurationSetting.setting_value) || 3;
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + trialDays);
                
                // 创建试用卡密
                const trialCardKey = `TRIAL_${device_id.slice(-8)}`;
                await env.DB.prepare(
                    "INSERT OR IGNORE INTO bindings (card_key, device_id, bind_date, expiry_date, status) VALUES (?, ?, 1, ?, 'active')"
                ).bind(trialCardKey, device_id, expiryDate.toISOString().split('T')[0]).run();
                
                await logUsage(env, trialCardKey, device_id, request);
                return new Response(JSON.stringify({ status: "success", message: "试用成功", expiry_date: expiryDate.toISOString().split('T')[0], is_trial: true }));
            }
            return new Response(JSON.stringify({ status: "error", message: "卡密不存在" }));
        }

        // 2. 检查卡密状态
        if (cardInfo.status !== 'active') {
            return new Response(JSON.stringify({ status: "error", message: "卡密已被暂停" }));
        }

        // 3. 检查过期
        if (new Date(cardInfo.expiry_date) < new Date()) {
            return new Response(JSON.stringify({ status: "error", message: "卡密已过期" }));
        }

        // 4. 处理绑定逻辑
        if (cardInfo.bind_date === 0) {
            const result = await env.DB.prepare("UPDATE bindings SET device_id = ?, bind_date = 1 WHERE card_key = ?").bind(device_id, card_key).run();
            if (result.changes > 0) {
                await logUsage(env, card_key, device_id, request);
                return new Response(JSON.stringify({ status: "success", message: "卡密绑定成功", expiry_date: cardInfo.expiry_date }));
            }
        } else {
            if (cardInfo.device_id === device_id) {
                await logUsage(env, card_key, device_id, request);
                return new Response(JSON.stringify({ status: "success", message: "验证成功", expiry_date: cardInfo.expiry_date }));
            } else {
                return new Response(JSON.stringify({ status: "error", message: "该卡密已绑定到其他设备" }));
            }
        }
    } catch (error) {
        return new Response(JSON.stringify({ status: "error", message: "服务器内部错误" }), { status: 500 });
    }
}

async function logUsage(env, cardKey, deviceId, request) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const userAgent = request.headers.get('User-Agent') || 'unknown';
    await env.DB.prepare("INSERT INTO usage_logs (card_key, device_id, ip_address, user_agent) VALUES (?, ?, ?, ?)").bind(cardKey, deviceId, ip, userAgent).run();
}
