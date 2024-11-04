import torch
import torchaudio
import io
import base64
import logging

# Set the audio backend to soundfile
torchaudio.set_audio_backend("soundfile")

class AudioPreprocessor:
    def __init__(self):
        self.sample_rate = 16000
        logging.basicConfig(level=logging.DEBUG)

    def preprocess(self, audio_data, options):
        """Preprocess the audio with selected options"""
        try:
            logging.debug(f"Starting audio preprocessing with options: {options}")
            
            # Remove the data URL prefix if present
            if ',' in audio_data:
                audio_data = audio_data.split(',')[1]
            
            # Decode base64 audio
            audio_bytes = base64.b64decode(audio_data)
            
            # Create a buffer from the bytes
            buffer = io.BytesIO(audio_bytes)
            
            # Load the audio file
            try:
                waveform, sample_rate = torchaudio.load(buffer)
                logging.debug(f"Audio loaded successfully. Shape: {waveform.shape}, Sample rate: {sample_rate}")
            except Exception as e:
                logging.error(f"Error loading audio: {str(e)}")
                raise

            steps = {}
            processed_audio = waveform

            # Apply preprocessing steps
            if options.get('resample'):
                target_rate = int(options.get('target_sample_rate', 16000))
                processed_audio = self._resample_audio(processed_audio, sample_rate, target_rate)
                sample_rate = target_rate
                steps['Resample'] = self._audio_to_base64(processed_audio, sample_rate)

            if options.get('normalize'):
                processed_audio = self._normalize_audio(processed_audio)
                steps['Normalize'] = self._audio_to_base64(processed_audio, sample_rate)

            if options.get('noise_reduction'):
                processed_audio = self._apply_noise_reduction(processed_audio)
                steps['Noise Reduction'] = self._audio_to_base64(processed_audio, sample_rate)

            if options.get('time_stretch'):
                rate = float(options.get('stretch_rate', 1.0))
                processed_audio = self._apply_time_stretch(processed_audio, rate)
                steps['Time Stretch'] = self._audio_to_base64(processed_audio, sample_rate)

            if options.get('mfcc'):
                processed_audio = self._apply_mfcc(processed_audio, sample_rate)
                steps['MFCC'] = self._audio_to_base64(processed_audio, sample_rate)

            return {
                'preprocessing_steps': steps,
                'processed_audio': self._audio_to_base64(processed_audio, sample_rate)
            }

        except Exception as e:
            logging.error(f"Error in preprocessing: {str(e)}", exc_info=True)
            raise

    def _audio_to_base64(self, waveform, sample_rate):
        """Convert audio tensor to base64 string"""
        buffer = io.BytesIO()
        torchaudio.save(buffer, waveform, sample_rate, format="wav")
        buffer.seek(0)
        audio_b64 = base64.b64encode(buffer.getvalue()).decode()
        return f"data:audio/wav;base64,{audio_b64}"

    def _resample_audio(self, waveform, original_sample_rate, target_sample_rate):
        """Resample audio to target sample rate"""
        if original_sample_rate != target_sample_rate:
            resampler = torchaudio.transforms.Resample(
                orig_freq=original_sample_rate,
                new_freq=target_sample_rate
            )
            return resampler(waveform)
        return waveform

    def _normalize_audio(self, waveform):
        """Normalize audio using mean and standard deviation"""
        mean = torch.mean(waveform)
        std = torch.std(waveform)
        return (waveform - mean) / (std + 1e-8)

    def _apply_noise_reduction(self, waveform):
        """Apply noise reduction using spectral gating"""
        # Create spectrogram transform with complex output
        n_fft = 2048
        hop_length = 512
        spec_transform = torchaudio.transforms.Spectrogram(
            n_fft=n_fft,
            hop_length=hop_length,
            power=None  # This ensures we get complex output
        )
        
        # Compute complex spectrogram
        spec = spec_transform(waveform)
        
        # Compute magnitude spectrogram
        mag_spec = torch.abs(spec)
        
        # Estimate noise threshold
        noise_threshold = torch.median(mag_spec, dim=-1, keepdim=True)[0] * 1.5
        
        # Create mask
        mask = (mag_spec > noise_threshold).float()
        
        # Apply mask to complex spectrogram
        cleaned_spec = spec * mask
        
        # Convert back to waveform
        inverse_transform = torchaudio.transforms.InverseSpectrogram(
            n_fft=n_fft,
            hop_length=hop_length
        )
        
        return inverse_transform(cleaned_spec)

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

    def _apply_mfcc(self, waveform, sample_rate, n_mfcc=13):
        """Apply MFCC transform"""
        mfcc_transform = torchaudio.transforms.MFCC(
            sample_rate=sample_rate,
            n_mfcc=n_mfcc,
            melkwargs={
                'n_fft': 2048,
                'n_mels': 128,
                'hop_length': 512
            }
        )
        mfcc = mfcc_transform(waveform)
        
        # Convert back to audio using inverse DCT
        inverse_mfcc = torch.matmul(mfcc.transpose(-1, -2), 
                                  mfcc_transform.dct_mat.transpose(-1, -2))
        return inverse_mfcc.transpose(-1, -2)