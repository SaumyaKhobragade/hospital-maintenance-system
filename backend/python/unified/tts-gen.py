import asyncio
import edge_tts

conversation = """
Doctor: Hello, what seems to be the problem?

Patient: I feel like I am forgetting everything.

Doctor: When did you notice it?

Patient: 1 week ago.

Doctor: Make sure you drink plenty of water and stay away from alcoholic drinks.

Patient: Thank you, doctor.
"""

async def main():
    communicate = edge_tts.Communicate(
        conversation,
        voice="en-US-JennyNeural"
    )
    await communicate.save("doctor_patient.wav")

asyncio.run(main())