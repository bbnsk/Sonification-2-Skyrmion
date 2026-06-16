import numpy as np
import soundfile as sf
import scipy.signal as signal

# Параметры
samplerate = 44100
duree_note = 0.5  # секунд на одну ноту
total_duration = 60  # общая продолжительность аудио (в секундах)

# Центры пиков в графике (Photon Energy) → переведём в частоты Гц
energies = [284.5, 589.3, 287.8]  # Пики на графике
frequences = [e * 100 for e in energies]  # ≈ [28450, 28630, 28780] Гц

# Для слышимого диапазона снизим частоты (например, /10)
frequences = [f / 10 for f in frequences]  # ≈ [2845, 2863, 2878] Гц

# Генерация синусоид по частотам
melodie = []
num_notes = int(total_duration / duree_note)  # сколько нот на весь трек

for i in range(num_notes):
    freq = frequences[i % len(frequences)]  # цикличное использование частот
    t = np.linspace(0, duree_note, int(samplerate * duree_note), endpoint=False)
    signal_note = 0.5 * np.sin(2 * np.pi * freq * t)
    melodie.append(signal_note)

# Объединение сигналов
signal_total = np.concatenate(melodie)

# Нормализация
signal_total = signal_total / np.max(np.abs(signal_total))

# Эффект реверберации
def add_reverb(signal, decay=0.5, delay=0.3):
    delay_samples = int(samplerate * delay)
    reverb_signal = np.copy(signal)
    for i in range(delay_samples, len(signal)):
        reverb_signal[i] += decay * signal[i - delay_samples]
    return reverb_signal

# Эффект эхо
def add_echo(signal, delay=0.5, decay=0.6):
    delay_samples = int(samplerate * delay)
    echo_signal = np.copy(signal)
    for i in range(delay_samples, len(signal)):
        echo_signal[i] += decay * signal[i - delay_samples]
    return echo_signal

# Эффект дисторшн
def add_distortion(signal, threshold=0.7, gain=2.0):
    signal_distorted = np.copy(signal)
    signal_distorted[np.abs(signal_distorted) > threshold] *= gain
    return signal_distorted

# Применяем эффекты
signal_total = add_reverb(signal_total)
signal_total = add_echo(signal_total)
signal_total = add_distortion(signal_total)

# Сохранение в файл
sf.write("audio_with_effects.wav", signal_total, samplerate)
print("✅ Аудио с эффектами сохранено как 'audio_with_effects.wav'")
