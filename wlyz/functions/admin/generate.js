// /functions/admin/generate.js
export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const { expiry_date, quantity } = await request.json();
        const generated_keys = [];

        if (quantity > 100) {
            return new Response(JSON.stringify({ status: "error", message: "生成数量不能超过100" }), { status: 400 });
        }

        for (let i = 0; i < quantity; i++) {
            const card_key = generateCardKey();
            try {
                await env.DB.prepare(
                    "INSERT INTO bindings (card_key, bind_date, expiry_date, status) VALUES (?, 0, ?, 'active')"
                ).bind(card_key, expiry_date).run();
                generated_keys.push(card_key);
            } catch (e) {
                // 忽略重复的卡密错误，继续生成
                if (!e.message.includes('UNIQUE constraint failed')) {
                    throw e;
                }
            }
        }

        return new Response(JSON.stringify({ status: "success", keys: generated_keys }));

    } catch (error) {
        return new Response(JSON.stringify({ status: "error", message: "生成失败" }), { status: 500 });
    }
}

function generateCardKey() {
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let card_key = '';
    for (let i = 0; i < 10; i++) {
        card_key += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return card_key;
}
