export interface QuranAiPromptContext {
  surahNumber: number
  surahName: string
  ayahNumber: number
  ayahText: string
  wordText?: string
  question: string
}

export interface QuranAiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const AI_API_URL = 'https://api-server-production-f8f8.up.railway.app/v1/chat/completions'
const AI_API_KEY = 'sk-quran-dashboard'
const AI_MODEL = 'gemini-3.8-flash'

const SYSTEM_PROMPT = `أنت "المساعد القرآني واللغوي الذكي"، باحث إسلامي متخصص في علوم القرآن الكريم واللغة العربية.
مهمتك إجابة أسئلة القارئ بدقة علمية وأسلوب مبسط وموثق حول:
1. الرسم العثماني وقواعد كتابة الكلمات القرآنية (الحذف، الزيادة، الهمز، البدل، الفصل والوصل، وما فيه قراءتان).
2. الإعراب والمعنى الصرفي والنحوي.
3. التفسير الميسر وبيان المعنى في سياق الآية الكريمة.
4. اللطائف البلاغية وأسباب النزول إن وُجدت.
5. أحكام التجويد والنطق السليم.

إرشادات الإجابة:
- كن دقيقاً ومباشراً ومهذباً، واذكر القواعد اللغوية والرسم بوضوح.
- نسّق إجابتك باستخدام نقاط وعناوين واضحة لسهولة القراءة.
- إذا كان السؤال عن سبب رسم كلمة بشكل معين، بيّن خصائص الرسم العثماني التوقيفي وفائدته البلاغية أو التفسيرية.
- اكتب باللغة العربية الفصيحة الواضحة والجميلة.`

export async function askQuranAi(params: QuranAiPromptContext): Promise<string> {
  const { surahNumber, surahName, ayahNumber, ayahText, wordText, question } = params

  let userPrompt = `السورة: ${surahName} (رقم السورة: ${surahNumber})
رقم الآية: ${ayahNumber}
الآية كاملة (Ayah): «${ayahText}»
`
  if (wordText) {
    userPrompt += `الجزء المختار / السؤال عنه (Selective / Question about): «${wordText}»\n`
  } else {
    userPrompt += `الجزء المختار / السؤال عنه (Selective / Question about): الآية الكريمة كاملة\n`
  }

  userPrompt += `\nسؤال القارئ (Question): ${question}\n\nيرجى الإجابة بدقة علمية وتفسيرية ولغوية واضحة وميسرة.`

  const messages: QuranAiMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ]

  try {
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('AI Gateway Error:', response.status, errorText)
      throw new Error(`تعذر الاتصال بخدمة الذكاء الاصطناعي (رمز الخطأ: ${response.status})`)
    }

    const data = await response.json()
    const answer = data?.choices?.[0]?.message?.content

    if (!answer) {
      throw new Error('لم يتم استلام رد من نموذج الذكاء الاصطناعي')
    }

    return answer.trim()
  } catch (err: any) {
    console.error('askQuranAi failure:', err)
    throw new Error(err.message || 'حدث خطأ أثناء إرسال السؤال للذكاء الاصطناعي')
  }
}
