import asyncio
import edge_tts
from pydub import AudioSegment
import os

dialogue = [
    ("డాక్టర్: నమస్కారం, మీకు ఏ సమస్య ఉంది?", "te-IN-MohanNeural"),
    ("डॉक्टर, मला खूप तहान लागते आणि वारंवार लघवीला जावे लागते.", "mr-IN-ManoharNeural"),
    ("డాక్టర్: ఈ లక్షణాలు మధుమేహానికి సంబంధించినవై ఉండవచ్చు. రక్తంలో చక్కెర పరీక్ష చేయించారా?", "te-IN-MohanNeural"),
    ("हो डॉक्टर, तपासणीत साखर जास्त असल्याचे सांगितले.", "mr-IN-ManoharNeural"),
    ("డాక్టర్: సరే. మందులు, సరైన ఆహారం మరియు వ్యాయామంతో దీన్ని నియంత్రించవచ్చు.", "te-IN-MohanNeural"),
    ("ठीक आहे डॉक्टर, मी तुमच्या सल्ल्याचे पालन करेन.", "mr-IN-ManoharNeural"),
]

async def generate_audio():
    combined = AudioSegment.empty()

    for i, (text, voice) in enumerate(dialogue):
        filename = f"line_{i}.mp3"

        communicate = edge_tts.Communicate(
            text=text,
            voice=voice,
            rate="+25%"
        )

        await communicate.save(filename)

        audio = AudioSegment.from_mp3(filename)
        combined += audio
        combined += AudioSegment.silent(duration=300)

    combined.export("doctor_patient.wav", format="wav")

    for i in range(len(dialogue)):
        try:
            os.remove(f"line_{i}.mp3")
        except:
            pass

    print("Saved as diabetes_conversation.wav")

asyncio.run(generate_audio())