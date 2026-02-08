import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

serve(async (req) => {
    const { searchParams } = new URL(req.url)
    const target = searchParams.get('target')

    if (!target) {
        return new Response('Missing target parameter', { status: 400 })
    }

    console.log(`Redirecting to: ${target}`)

    return new Response(null, {
        status: 302,
        headers: {
            'Location': target,
        },
    })
})
