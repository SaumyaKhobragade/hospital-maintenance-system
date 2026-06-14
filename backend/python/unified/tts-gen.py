import asyncio
import edge_tts
from pydub import AudioSegment
import os

dialogue = [
    ("Médecin : Bonjour, quel est votre problème ?", "fr-FR-HenriNeural"),
    ("Docteur, j'ai très soif et je vais souvent aux toilettes.", "fr-FR-DeniseNeural"),
    ("Médecin : Ces symptômes peuvent indiquer un diabète. Avez-vous fait une analyse de glycémie ?", "fr-FR-HenriNeural"),
    ("Oui docteur, les résultats montrent un taux de sucre élevé.", "fr-FR-DeniseNeural"),
    ("Médecin : D'accord. Avec des médicaments, une alimentation adaptée et de l'exercice, nous pouvons le contrôler.", "fr-FR-HenriNeural"),
    ("Merci docteur, je suivrai vos conseils.", "fr-FR-DeniseNeural"),
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

    combined.export("diabetes_french_conversation.wav", format="wav")

    for i in range(len(dialogue)):
        try:
            os.remove(f"line_{i}.mp3")
        except:
            pass

    print("Saved as diabetes_french_conversation.wav")

asyncio.run(generate_audio())