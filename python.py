import numpy as np
import matplotlib.pyplot as plt
from scipy.io.wavfile import write

# --- Примерные данные с графика (визуальная реконструкция) ---
current_density = np.array([0, 25, 50, 100, 150, 200, 250, 300])

velocity_350K = np.array([0, 10, 22, 50, 75, 90, 100, 110])     # Синяя линия
velocity_90K = np.array([0, 6, 12, 35, 55, 70, 80, 85])          # Чёрная пунктирная линия
velocity_290K = np.array([0, 5, 10, 25, 40, 50, 55, 60])         # Красная линия

deflection_350K = np.array([40, 41, 42, 43, 43.5, 44, 44, 45])   # Синяя
deflection_290K = np.array([-20, -22, -23, -24, -25, -26, -26.5, -27])  # Красная

# --- Параметры для аудиосинтеза ---
sample_rate = 44100
duration_per_point = 0.3  # сек

# --- Функция генерации тона ---
def generate_tone(freq, duration, amplitude=0.5):
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    tone = amplitude * np.sin(2 * np.pi * freq * t)
    return tone

# --- Маппинг значений в частоты ---
def map_to_freq(data, base_freq=220, scale=2):
    norm = (data - np.min(data)) / (np.ptp(data))
    return base_freq + norm * base_freq * scale

# --- Сбор музыкального потока ---
def build_audio_track(*datasets, base_freq=220, color='none'):
    audio = np.array([], dtype=np.float32)
    for data in datasets:
        freqs = map_to_freq(data, base_freq)
        for f in freqs:
            tone = generate_tone(f, duration_per_point)
            audio = np.concatenate((audio, tone))
    # Эффекты: реверберация и цветовой фильтр по вкусу
    if color == 'blue':
        audio *= np.linspace(0.7, 1.0, len(audio))  # яркость
    elif color == 'red':
        audio = audio[::-1] * 0.9  # реверс
    elif color == 'black':
        audio = audio * np.sin(np.linspace(0, np.pi, len(audio)))  # пульсация
    return audio

# --- Генерация аудиотреков ---
audio_blue = build_audio_track(velocity_350K, deflection_350K, base_freq=300, color='blue')
audio_red = build_audio_track(velocity_290K, deflection_290K, base_freq=180, color='red')
audio_black = build_audio_track(velocity_90K, base_freq=150, color='black')

# --- Функция выравнивания аудиотреков по длине ---
def pad_to_longest(*tracks):
    max_len = max(len(track) for track in tracks)
    return [np.pad(track, (0, max_len - len(track))) for track in tracks]

# --- Выравнивание треков ---
audio_blue, audio_red, audio_black = pad_to_longest(audio_blue, audio_red, audio_black)

# --- Финальный микс ---
mix = audio_blue + audio_red + audio_black
mix = mix / np.max(np.abs(mix))  # нормализация

# --- Повторение до одной минуты ---
desired_duration_sec = 60
current_duration_sec = len(mix) / sample_rate
repeat_count = int(np.ceil(desired_duration_sec / current_duration_sec))
mix_extended = np.tile(mix, repeat_count)
mix_extended = mix_extended[:int(sample_rate * desired_duration_sec)]  # обрезаем до ровной минуты

# --- Сохранение ---
write("skyrmion_sonification.wav", sample_rate, (mix_extended * 32767).astype(np.int16))

print("Музыкальный научный файл создан: skyrmion_sonification.wav")
