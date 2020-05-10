![](https://github.com/Unrupt/unrupt.github.io/blob/master/images/unrupt%20logo.PNG?raw=true)
# So no-one's ideas are lost.

Unrupt solves the issue of cross talking or interruptions to ensure that both sides do not lose their chain of thoughts. The ***pause-while-speaking*** feature in Unrupt automatically pauses and buffers what the other user is saying while you are talking. 
When you finish talking, it plays out what the other person said. In addition, there's a manual pause feature, which mutes you, buffers the other user's speech and plays it out when you click unpause. 

### Demos

You can go to our Unrupt [DEMO VERSION](https://unrupt.github.io/unrupt) or our Unrupt [PODCAST VERSION](https://unrupt.github.io/try) now in alpha test, which optionally creates a podcast in the backgrund during the call with each speaker to the left or right.

The screenshot below illustrates the features of the unrupt webapp.

<img src="https://image.ibb.co/mYquwo/Unrupt_Annotation.png" alt="Unrupt_Annotation" border="0">

‍**This avoids interruption or disruption from people speaking over each other or backing down, instead each person can speak their thoughts as they arise, and they are played out one after the other, so no-one's ideas are lost.**

In the YouTube Video below, Tim Panton, the initial developer for Unrupt, explained and demonstrated how the system worked at Kamailio World Conference 2018. He demonstrated the ***pause-while-speaking*** feature and the audio waveforms that were displayed, which indicated when someone is speaking or playing from buffer. 

<a target="_blank" href="https://www.youtube.com/embed/az_g2tOxhPI?start=782&amp;end=936&amp;autoplay=1" rel="nofollow"><img data-canonical-src="https://www.youtube.com/embed/az_g2tOxhPI?start=782&amp;end=936&amp;autoplay=1" src="https://camo.githubusercontent.com/d6d7498df7c7318d9b975655632617b33cdafbef/68747470733a2f2f696d6167652e6962622e636f2f6248484474792f64656d6f2e706e67" alt="UNRUPT DEMO" data-canonical-src="https://image.ibb.co/bHHDty/demo.png" style="max-width:100%;"></a>

The buffer shows a blue band for duration of speech by the near speaker and an orange band for duration of unheard speech by the far speaker, which is buffered during the near speech and played out when the near speaker stops speaking. The manual pause button also sets Mute on and off. The video feed is optional and continues live while the audio is buffered.

## **Roadmap**

More excerpts from Tim's show and ideas for what next in our [Roadmap 2018](https://docs.google.com/document/d/1Xf5LLFaNVRIa-bGX67v_XsYMWW4lbfdKqtzS3_iYNF4/edit#). For context, take a look at [this document with comments on Tim's signalling proposal](https://docs.google.com/document/d/1GMY7wygeD0dyH3lxl3YjRJM2G2v9ZGiBeg7x-AOCuiM/edit?usp=sharing)

### Known Issues with Unrupt and WebRTC

- User has to grant permissions for their webcam and microphone. This user gesture is required by major browsers, which might interrupt the process of the application. 
- On iPhone 7 and above, the buffering becomes unstable after clicking on mute then unmute two times (Unrupt only)


### Browsers support

<table class="rich-diff-level-zero">
    <thead class="rich-diff-level-one">
        <tr>
            <th></th>
            <th colspan="4">Desktop</th>
            <th colspan="3">Mobile</th>
        </tr>
        <tr>
            <th>
                <img src="https://camo.githubusercontent.com/bdaab155ed964b17a6b6050947a47f4fec73c1c4/68747470733a2f2f7468756d622e6962622e636f2f64474a6439382f756e727570745f6c6f676f5f6d696e2e706e67" alt="unrupt_logo_min" border="0" data-canonical-src="https://thumb.ibb.co/dGJd98/unrupt_logo_min.png" style="max-width:100%;">
            </th>
            <th>
                <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt="IE / Edge" width="24px" height="24px" style="max-width:100%;">
            </th>
            <th>
                <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" style="max-width:100%;">
            </th>
            <th>
                <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" style="max-width:100%;">
            </th>
            <th>
                <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari" width="24px" height="24px" style="max-width:100%;">
            </th>
            <th>
                <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox Mobile" width="24px" height="24px" style="max-width:100%;">
            </th>
            <th>
                <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome Mobile" width="24px" height="24px" style="max-width:100%;">
            </th>
            <th>
                <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari Mobile" width="24px" height="24px" style="max-width:100%;">
            </th>
        </tr>
    </thead>
    <tbody class="rich-diff-level-one">
        <tr>
            <td>Basic Support</td>
            <td align="center" alt="ie" >IE11, Edge</td>
            <td align="center" alt="Firefox" >60+</td>
            <td align="center" alt="Chrome" >49+</td>
            <td align="center" alt="Safari" >11.1+</td>
            <td align="center" alt="Firefox Mobile" >44</td>
            <td align="center" alt="Chrome Mobile" >56</td>
            <td align="center" alt="Safari Mobile" >11.3</td>
        </tr>
        <tr>
            <td>Video Call</td>
            <td align="center" alt="ie" >IE11, Edge</td>
            <td align="center" alt="Firefox" >60+</td>
            <td align="center" alt="Chrome" >49+</td>
            <td align="center" alt="Safari" >11.1+</td>
            <td align="center" alt="Firefox Mobile" >44+</td>
            <td align="center" alt="Chrome Mobile" >56+</td>
            <td align="center" alt="Safari Mobile" >11.3</td>
        </tr>
        <tr>
            <td>Voice Call</td>
            <td align="center" alt="ie" >IE11, Edge</td>
            <td align="center" alt="Firefox" >60+</td>
            <td align="center" alt="Chrome" >49+</td>
            <td align="center" alt="Safari" >11.1+</td>
            <td align="center" alt="Firefox Mobile" >44+</td>
            <td align="center" alt="Chrome Mobile" >56+</td>
            <td align="center" alt="Safari Mobile" >11.3</td>
        </tr>
        <tr>
            <td>Pause-While-Speaking</td>
            <td align="center" alt="ie" >IE11, Edge</td>
            <td align="center" alt="Firefox" >60+</td>
            <td align="center" alt="Chrome" >49+</td>
            <td align="center" alt="Safari" >11.1+</td>
            <td align="center" alt="Firefox Mobile" >44+</td>
            <td align="center" alt="Chrome Mobile" >56+</td>
            <td align="center" alt="Safari Mobile" >11.3</td>
        </tr>
        <tr>
            <td>Manual Pause/Play</td>
            <td align="center" alt="ie" >IE11, Edge</td>
            <td align="center" alt="Firefox" >60+</td>
            <td align="center" alt="Chrome" >49+</td>
            <td align="center" alt="Safari" >11.1+</td>
            <td align="center" alt="Firefox Mobile" >44+</td>
            <td align="center" alt="Chrome Mobile" >56+</td>
            <td align="center" alt="Safari Mobile" >?</td>
        </tr>
        <tr>
            <td>Mute while <br/>Pause-While-Speak<br> is on</td>
            <td align="center" alt="ie" >IE11, Edge</td>
            <td align="center" alt="Firefox" >60+</td>
            <td align="center" alt="Chrome" >49+</td>
            <td align="center" alt="Safari" >?</td>
            <td align="center" alt="Firefox Mobile" >44+</td>
            <td align="center" alt="Chrome Mobile" >56+</td>
            <td align="center" alt="Safari Mobile" >X</td>
        </tr>
    </tbody>
</table>

### Useful Links

* [Unrupt and WebRTC Real Time Communication without Plugins](https://docs.google.com/presentation/d/e/2PACX-1vQFTN14JutDuXvi-DUKWtp7gMfRggnoAwvycis8Ly450JKKwOOIV3ggPjPhWxZDgM6-08ohvZutpwus/pub?start=false&loop=false&delayms=3000) by Oshane Bailey

## **Licences**

For information on the non-commercial MIT open source licence of the demo software visit [our gitthub licence page](https://github.com/steely-glint/unrupt-demo/blob/master/LICENSE). If you're interested in commercial licensing for white label adoption into your own products visit [the commercial patent license page](https://docs.google.com/document/d/1Vllclet_HAtP1CSrq9xUfyZ9OAf53xEurgfGcryjurc/edit?usp=sharing) feel free to speak to us about consulting and implementation help.The original [source code](https://github.com/steely-glint/unrupt-demo) is at [https://github.com/steely-glint/unrupt-demo](https://github.com/steely-glint/unrupt-demo)[](https://docs.google.com/document/d/1GMY7wygeD0dyH3lxl3YjRJM2G2v9ZGiBeg7x-AOCuiM/edit?usp=sharing)




© 2018 GitHub, Inc. Terms Privacy Security Status Help Contact GitHub API Training Shop Blog About Press h to open a hovercard with more details.
