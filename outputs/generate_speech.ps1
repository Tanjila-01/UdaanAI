Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SetOutputToWaveFile('outputs\english_sample1.wav')
$synth.Speak('Good morning, how do you do?')
$synth.SetOutputToWaveFile('outputs\english_sample2.wav')
$synth.Speak('What does a software developer do?')
$synth.Dispose()
Write-Host "Generated audio files successfully."
