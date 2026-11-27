/* Original procedural compositions and sound-design recipes, no third-party audio files. */
const AUDIO68=Object.freeze({
 defaults:{musicVolume:.72,sfxVolume:.8,ambienceVolume:.38,ambience:true},
 maxVoices:64,maxSfx:30,maxMusic:34,
 menu:{bpm:64,chords:[[38,50,53,57],[34,46,50,53],[31,43,46,50],[33,45,49,52]],motif:[62,65,69,null,70,69,65,null,62,60,58,null,61,64,57,null]},
 campaign:{bpm:76,chords:[[38,50,53,57],[34,46,50,53],[36,48,52,55],[33,45,49,52]],motif:[62,69,65,null,60,65,69,null,67,64,62,null,61,64,57,null]},
 ambience:{menu:[55,110,420,.07,.12,.12],valley:[55,82.4,680,.15,.045,.16],forest:[46.25,69.3,1150,.13,.055,.32],frozen:[65.4,98,2100,.17,.035,.22],ashen:[41.2,61.7,380,.24,.075,.55],cathedral:[49,73.4,520,.065,.17,.09]},
 gap:{ui:.09,summon:.14,tick:.045,stop:.055,death:.12,altar:.15,coin:.1,line:.15,fusion:.2}
});
