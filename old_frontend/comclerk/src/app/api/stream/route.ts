import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return new Response(
        JSON.stringify({ error: '메시지가 필요합니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 모의 응답 텍스트 생성
    const mockResponses = [
      "안녕하세요! PDF 문서에 대해 질문해주셔서 감사합니다.",
      "문서를 분석해보니 흥미로운 내용들이 많이 있네요.",
      "특히 관심 있으신 부분에 대해 자세히 설명드리겠습니다.",
      "추가로 궁금한 점이 있으시면 언제든 말씀해주세요.",
      "도움이 되셨기를 바랍니다!"
    ];

    const responseText = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    const words = responseText.split(' ');

    // SSE 스트림 생성
    const stream = new ReadableStream({
      start(controller) {
        let wordIndex = 0;
        
        const sendWord = () => {
          if (wordIndex < words.length) {
            const word = words[wordIndex];
            const data = `data: ${JSON.stringify({ 
              message: word + (wordIndex < words.length - 1 ? ' ' : ''),
              isComplete: false
            })}\n\n`;
            
            controller.enqueue(new TextEncoder().encode(data));
            wordIndex++;
            
            // 0.1초 후 다음 단어 전송
            setTimeout(sendWord, 100);
          } else {
            // 스트리밍 완료
            const completeData = `data: ${JSON.stringify({ 
              message: '',
              isComplete: true
            })}\n\n`;
            
            controller.enqueue(new TextEncoder().encode(completeData));
            controller.close();
          }
        };

        // 첫 번째 단어 전송 시작
        sendWord();
      },

      cancel() {
        // 클라이언트 연결 해제 시 정리
        console.log('Stream cancelled by client');
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Streaming error:', error);
    return new Response(
      JSON.stringify({ error: '스트리밍 중 오류가 발생했습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}