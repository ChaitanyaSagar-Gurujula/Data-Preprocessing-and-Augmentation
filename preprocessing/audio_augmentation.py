import torch
import torchaudio
import io
import base64
import logging
import librosa
import numpy as np

# Set the audio backend to soundfile
torchaudio.set_audio_backend("soundfile")

class AudioAugmenter:
    def __init__(self):
        self.sample_rate = 16000
        logging.basicConfig(level=logging.DEBUG)

    def _pitch_shift(self, waveform, sample_rate, n_steps):
        """Shift the pitch of the audio"""
        try:
            logging.debug(f"Original waveform shape: {waveform.shape}, sample_rate: {sample_rate}")
            
            # Convert torch tensor to numpy array
            waveform_np = waveform.numpy().squeeze()
            
            # Apply pitch shift using librosa
            shifted = librosa.effects.pitch_shift(
                y=waveform_np,
                sr=sample_rate,
                n_steps=n_steps,
                bins_per_octave=12  # Standard semitones per octave
            )
            
            # Convert back to torch tensor and maintain original shape
            shifted_tensor = torch.FloatTensor(shifted)
            if len(shifted_tensor.shape) == 1:
                shifted_tensor = shifted_tensor.unsqueeze(0)
                
            logging.debug(f"Augmented waveform shape: {shifted_tensor.shape}")
            return shifted_tensor
            
        except Exception as e:
            logging.error(f"Error in pitch shifting: {str(e)}")
            raise

    def _add_noise(self, waveform, noise_level):
        """Add random noise to audio"""
        try:
            # Ensure noise_level is between 0 and 1
            noise_level = max(0.0, min(1.0, noise_level))
            
            # Calculate signal power
            signal_power = waveform.norm(p=2)
            
            # Generate noise
            noise = torch.randn_like(waveform)
            noise_power = noise.norm(p=2)
            
            # Scale noise to match desired SNR
            scaling_factor = signal_power / noise_power * noise_level
            scaled_noise = noise * scaling_factor
            
            # Add scaled noise to original signal
            noisy_waveform = waveform + scaled_noise
            
            # Normalize to prevent clipping
            max_val = torch.max(torch.abs(noisy_waveform))
            if max_val > 1:
                noisy_waveform = noisy_waveform / max_val
                
            return noisy_waveform
            
        except Exception as e:
            logging.error(f"Error in noise addition: {str(e)}")
            raise

    def _time_mask(self, waveform, mask_param):
        """Apply time masking"""
        time_masking = torchaudio.transforms.TimeMasking(time_mask_param=mask_param)
        # Convert to spectrogram for time masking
        spec = torchaudio.transforms.MelSpectrogram()(waveform)
        masked_spec = time_masking(spec)
        # Convert back to waveform using Griffin-Lim
        griffin_lim = torchaudio.transforms.GriffinLim(
            n_fft=spec.size(1) * 2 - 2,
            n_iter=32
        )
        return griffin_lim(masked_spec)

    def _freq_mask(self, waveform, mask_param):
        """Apply frequency masking"""
        freq_masking = torchaudio.transforms.FrequencyMasking(freq_mask_param=mask_param)
        # Convert to spectrogram for frequency masking
        spec = torchaudio.transforms.MelSpectrogram()(waveform)
        masked_spec = freq_masking(spec)
        # Convert back to waveform using Griffin-Lim
        griffin_lim = torchaudio.transforms.GriffinLim(
            n_fft=spec.size(1) * 2 - 2,
            n_iter=32
        )
        return griffin_lim(masked_spec)

    def _audio_to_base64(self, waveform, sample_rate):
        """Convert audio tensor to base64 string"""
        buffer = io.BytesIO()
        torchaudio.save(buffer, waveform, sample_rate, format="wav")
        buffer.seek(0)
        audio_b64 = base64.b64encode(buffer.getvalue()).decode()
        return f"data:audio/wav;base64,{audio_b64}"

    def _apply_time_stretch(self, waveform, rate):
        """Apply time stretching to the audio waveform."""
        if rate != 1.0:
            # Convert to mono if stereo
            if waveform.size(0) > 1:
                waveform = torch.mean(waveform, dim=0, keepdim=True)

            # Create a complex spectrogram
            spec_transform = torchaudio.transforms.Spectrogram(
                n_fft=2048,
                hop_length=512,
                power=None  # Get complex spectrogram
            )
            spec = spec_transform(waveform)

            # Apply time stretch to the complex spectrogram
            stretch = torchaudio.transforms.TimeStretch(
                fixed_rate=rate,
                hop_length=512,
                n_freq=spec.shape[-2]
            )
            stretched_spec = stretch(spec)

            # Phase reconstruction using Griffin-Lim
            griffin_lim = torchaudio.transforms.GriffinLim(
                n_fft=2048,
                hop_length=512
            )
            stretched_waveform = griffin_lim(torch.abs(stretched_spec))

            return stretched_waveform

        return waveform

    def augment(self, audio_data, options):
        """Apply selected augmentation techniques"""
        try:
            logging.debug(f"Starting audio augmentation with options: {options}")
            
            # Remove the data URL prefix if present
            if ',' in audio_data:
                audio_data = audio_data.split(',')[1]
            
            # Decode base64 audio
            audio_bytes = base64.b64decode(audio_data)
            
            # Create a buffer from the bytes
            buffer = io.BytesIO(audio_bytes)
            
            # Load the audio file using torchaudio with soundfile backend
            waveform, sample_rate = torchaudio.load(buffer)
            logging.debug(f"Audio loaded successfully. Shape: {waveform.shape}, Sample rate: {sample_rate}")

            steps = {}
            augmented_audio = waveform

            if options.get('time_stretch', {}).get('enabled'):
                rate = float(options['time_stretch'].get('rate', 1.0))
                augmented_audio = self._apply_time_stretch(augmented_audio, rate)
                steps['Time Stretch'] = self._audio_to_base64(augmented_audio, sample_rate)

            # Pitch Shift
            if options.get('pitch_shift', {}).get('enabled'):
                n_steps = float(options['pitch_shift'].get('steps', 2))
                augmented_audio = self._pitch_shift(augmented_audio, sample_rate, n_steps)
                steps['Pitch Shift'] = self._audio_to_base64(augmented_audio, sample_rate)

            # Add Noise
            if options.get('noise', {}).get('enabled'):
                noise_level = float(options['noise'].get('level', 0.01))
                augmented_audio = self._add_noise(augmented_audio, noise_level)
                steps['Noise'] = self._audio_to_base64(augmented_audio, sample_rate)

            # Time Masking
            if options.get('time_mask', {}).get('enabled'):
                mask_param = int(options['time_mask'].get('param', 80))
                augmented_audio = self._time_mask(augmented_audio, mask_param)
                steps['Time Mask'] = self._audio_to_base64(augmented_audio, sample_rate)

            # Frequency Masking
            if options.get('freq_mask', {}).get('enabled'):
                mask_param = int(options['freq_mask'].get('param', 80))
                augmented_audio = self._freq_mask(augmented_audio, mask_param)
                steps['Frequency Mask'] = self._audio_to_base64(augmented_audio, sample_rate)


            return {
                'augmentation_steps': steps,
                'augmented_audio': self._audio_to_base64(augmented_audio, sample_rate)
            }

        except Exception as e:
            logging.error(f"Error in augmentation: {str(e)}", exc_info=True)
            raise