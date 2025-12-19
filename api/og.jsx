/* eslint-disable */
import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);

    // Get parameters
    const title = searchParams.get('title') || 'Jaipal Singh | Digital Marketing Expert';
    const excerpt = searchParams.get('excerpt') || 'Digital Marketing Expert with 10+ years of experience';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            backgroundImage: 'linear-gradient(to bottom right, #1e40af, #7c3aed, #4f46e5)',
            padding: '60px 80px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div
              style={{
                fontSize: 70,
                fontWeight: 'bold',
                color: 'white',
                lineHeight: 1.2,
                textAlign: 'left',
                maxWidth: '1000px',
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 32,
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: 1.4,
                maxWidth: '900px',
              }}
            >
              {excerpt}
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: '40px',
                gap: '20px',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: '600',
                  color: 'white',
                }}
              >
                Jaipal Singh
              </div>
              <div
                style={{
                  fontSize: 24,
                  color: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                •
              </div>
              <div
                style={{
                  fontSize: 24,
                  color: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                jaisingh.in
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.log(e.message);
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
}
