import rainbowSDK from './rainbow-sdk.min.js';
window.rainbowSDK = rainbowSDK; // Global value is now accessible from the console

(async function () {
    const config = {
        applicationID: '', // Update with your app ID
        applicationSecret: '', // Update with your app secret
        platform: 'sandbox', // can be set either to 'sandbox' or 'openrainbow.com'
    };
    const state = {
        loggedIn: false,
        connectedUser: null,
        isMuted: false,
    };

    const onReady = function onReady() {
        console.log('On SDK Ready !');
        console.log(`Rainbow Web SDK version :: ${window.sdkversion}`);
    };

    const onLoaded = async () => {
        console.log('Rainbow Web SDK has been loaded');
        try {
            await rainbowSDK.initialize(config.applicationID, config.applicationSecret);
            console.log('Rainbow Web SDK has been initialized');
        } catch (err) {
            throw new Error(err);
        }
    };
    function onStarted() {
        updateUserDetails();
        checkWebRtcCapabilities();
        getContacts();

        /* Device picker works only in Chrome */
        if (window.chrome) {
            displayDevicePicker();
        }
    }

    async function rainbowLogin() {
        const userName = document.getElementById('userName').value;
        const password = document.getElementById('password').value;
        loginButton.disabled = true;

        try {
            if (userName && password) {
                console.log('Log in with rainbow', userName, password);
                if (config.platform === 'sandbox') {
                    const account = await rainbowSDK.connection.signin(userName, password);
                    console.log(`Connected on Rainbow ${config.platform} platform. User connected: ${account.userData.displayName}`);
                    state.loggedIn = true;
                } else if (config.platform === 'openrainbow.com') {
                    const account = await rainbowSDK.connection.signinOnRainbowOfficial(userName, password);
                    console.log(`Connected on Rainbow ${config.platform} platform. User connected: ${account.userData.displayName}`);
                    state.loggedIn = true;
                }
            } else {
                throw new Error('Username or password missing');
            }
        } catch (err) {
            throw new Error(err);
        }
    }

    function getContacts() {
        console.log('Fetching user contacts');
        const contacts = rainbowSDK.contacts.getAll();
        if (contacts) {
            contacts.forEach((contact) => {
                const contactsContainer = document.getElementById('contactsContainer');
                const contactCard = createContactCard(contact);
                contactsContainer.appendChild(contactCard);
            });
        }
        return;
    }

    function checkWebRtcCapabilities() {
        state.hasACamera = rainbowSDK.webRTC.hasACamera();
        console.log('Camera available: ', state.hasACamera);
        state.canMakeAudioVideoCall = rainbowSDK.webRTC.canMakeAudioVideoCall();
        console.log('Can make Audio / Video calls: ', state.canMakeAudioVideoCall);

        // Show the info in userDetails panel
        const userDetails = document.getElementById('userDetails');
        const webRtcStatus = document.createElement('div');
        webRtcStatus.id = 'webRtcStatus';
        webRtcStatus.innerHTML = `<hr>
			Camera: ${state.hasACamera}
			<br>
			WebRTC: ${state.canMakeAudioVideoCall}
		`;

        userDetails.appendChild(webRtcStatus);
    }

    async function displayDevicePicker() {
        const userPanel = document.getElementById('userPanel');
        if (userPanel) {
            const devicePicker = document.createElement('div');
            devicePicker.id = 'devicePicker';
            const audioInput = [];
            const audioOutput = [];
            const videoInput = [];

            navigator.mediaDevices
                .getUserMedia({ audio: true, video: true })
                .then((stream) => {
                    /* Stream received which means that the user has authorized the application to access to the audio and video devices. Local stream can be stopped at this time */
                    stream.getTracks().forEach((track) => {
                        track.stop();
                    });

                    /*  Get the list of available devices */
                    navigator.mediaDevices
                        .enumerateDevices()
                        .then((devices) => {
                            /* Do something for each device (e.g. add it to a selector list) */
                            devices.forEach(function (device) {
                                switch (device.kind) {
                                    case 'audioinput':
                                        // This is a device of type 'microphone'
                                        audioInput.push(device);
                                        break;
                                    case 'audiooutput':
                                        // This is a device of type 'speaker'
                                        audioOutput.push(device);
                                        break;
                                    case 'videoinput':
                                        // This is a device of type 'camera'
                                        videoInput.push(device);
                                        break;
                                    default:
                                        break;
                                }
                            });

                            const audioInputElement = document.createElement('select');
                            audioInputElement.id = 'audioInputElement';
                            const audioInputElementLabel = document.createElement('label');
                            audioInputElementLabel.for = 'audioInputElement';
                            audioInputElementLabel.innerHTML = 'Choose audio input:';
                            audioInput.forEach((device) => {
                                const option = document.createElement('option');
                                option.innerHTML = device.label;
                                audioInputElement.appendChild(option);
                            });
                            // audioInputElement.onfocus = () => {
                            // this.selectedIndex = -1;
                            // };
                            audioInputElement.onchange = () => {
                                console.log('Audio input change', audioInputElement.value);
                                let deviceId = null;
                                audioInput.forEach((device) => {
                                    if (device.label === audioInputElement.value) {
                                        deviceId = device.deviceId;
                                    }
                                });
                                if (deviceId) {
                                    rainbowSDK.webRTC.useMicrophone(deviceId);
                                } else {
                                    console.error("Couldn't change the audio input");
                                }
                            };
                            devicePicker.appendChild(audioInputElementLabel);
                            devicePicker.appendChild(audioInputElement);

                            const audioOutputElement = document.createElement('select');
                            audioOutputElement.id = 'audioOutputElement';
                            const audioOutputElementLabel = document.createElement('label');
                            audioOutputElementLabel.for = 'audioOutputElement';
                            audioOutputElementLabel.innerHTML = 'Choose audio output:';
                            audioOutput.forEach((device) => {
                                const option = document.createElement('option');
                                option.innerHTML = device.label;
                                audioOutputElement.appendChild(option);
                            });
                            audioOutputElement.onchange = () => {
                                console.log('Audio output change', audioOutputElement.value);
                                let deviceId = null;
                                audioOutput.forEach((device) => {
                                    if (device.label === audioOutputElement.value) {
                                        deviceId = device.deviceId;
                                    }
                                });
                                if (deviceId) {
                                    rainbowSDK.webRTC.useSpeaker(deviceId);
                                } else {
                                    console.error("Couldn't change the audio output");
                                }
                            };
                            devicePicker.appendChild(audioOutputElementLabel);
                            devicePicker.appendChild(audioOutputElement);

                            const videoInputElement = document.createElement('select');
                            videoInputElement.id = 'videoInputElement';
                            const videoInputElementLabel = document.createElement('label');
                            videoInputElementLabel.for = 'videoInputElement';
                            videoInputElementLabel.innerHTML = 'Choose video input:';
                            videoInput.forEach((device) => {
                                const option = document.createElement('option');
                                option.innerHTML = device.label;
                                videoInputElement.appendChild(option);
                            });
                            videoInputElement.onchange = () => {
                                console.log('Audio output change', videoInputElement.value);
                                let deviceId = null;
                                videoInput.forEach((device) => {
                                    if (device.label === videoInputElement.value) {
                                        deviceId = device.deviceId;
                                    }
                                });
                                if (deviceId) {
                                    rainbowSDK.webRTC.useCamera(deviceId);
                                } else {
                                    console.error("Couldn't change the video input");
                                }
                            };
                            devicePicker.appendChild(videoInputElementLabel);
                            devicePicker.appendChild(videoInputElement);

                            userPanel.appendChild(devicePicker);
                        })
                        .catch((error) => {
                            /* In case of error when enumerating the devices */
                            throw error;
                        });
                })
                .catch((error) => {
                    /* In case of error when authorizing the application to access the media devices */
                    throw error;
                });
        }
    }

    window.signOut = async () => {
        console.log('Sign out of Rainbow');
        try {
            await rainbowSDK.connection.signout();
            config.connectedUser = null;
            console.log('Signed out!');

            // Clean DOM state
            document.getElementById('loginForm').style.display = 'block';
            const signOutButton = document.getElementById('signOutButton');
            signOutButton.parentNode.removeChild(signOutButton);
            const avatar = document.getElementById('avatarPicture');
            if (avatar) {
                avatar.parentNode.removeChild(avatar);
            }
            const webRtcStatus = document.getElementById('webRtcStatus');
            webRtcStatus.parentNode.removeChild(webRtcStatus);
            document.getElementById('connectedUserName').innerHTML = '';
            document.getElementById('connectedUserId').innerHTML = '';
            document.getElementById('connectedUserPresence').innerHTML = 'Offline';
            loginButton.disabled = false;
            document.getElementById('contactsContainer').innerHTML = '';
        } catch (err) {
            throw err;
        }
    };

    // **** WEBRTC RAINBOW METHODS
    window.callInAudio = async (contactId) => {
        console.log('Call in audio. Contact ID: ', contactId);
        await rainbowSDK.webRTC.callInAudio(contactId);
    };

    window.callInSharing = async (contactId) => {
        console.log('Call in audio. Contact ID: ', contactId);
        await rainbowSDK.webRTC.callInSharing(contactId);
    };

    window.callInVideo = async (contactId) => {
        console.log('Call in video. Contact ID: ', contactId);
        await rainbowSDK.webRTC.callInVideo(contactId);
    };

    window.releaseCall = () => {
        console.log('Release call');
        if (state.call) {
            rainbowSDK.webRTC.release(state.call.id);
        } else {
            console.error('No call to release');
        }
    };

    window.answerInAudio = () => {
        rainbowSDK.webRTC.answerInAudio(state.call.id);
    };

    window.answerInVideo = () => {
        rainbowSDK.webRTC.answerInVideo(state.call.id);
    };

    window.muteCall = () => {
        try {
            const call = rainbowSDK.webRTC.muteAudioCall(state.call.id);
            if (call.status.value === 'active' && call.isMuted) {
                const callStatus = document.getElementById('callStatus');
                const muteCallButton = document.getElementById('muteCallButton');
                if (muteCallButton) {
                    muteCallButton.parentNode.removeChild(muteCallButton);
                }
                const unmuteCallButton = document.createElement('button');
                unmuteCallButton.id = 'unmuteCallButton';
                unmuteCallButton.innerHTML = 'Unmute call';
                unmuteCallButton.onclick = () => {
                    unmuteCall();
                };
                callStatus.appendChild(unmuteCallButton);
            }
        } catch (err) {
            throw err;
        }
    };

    window.unmuteCall = () => {
        try {
            const call = rainbowSDK.webRTC.unmuteAudioCall(state.call.id);
            if (call.status.value === 'active' && !call.isMuted) {
                const callStatus = document.getElementById('callStatus');
                const unmuteCallButton = document.getElementById('unmuteCallButton');
                if (unmuteCallButton) {
                    unmuteCallButton.parentNode.removeChild(unmuteCallButton);
                }
                const muteCallButton = document.createElement('button');
                muteCallButton.id = 'muteCallButton';
                muteCallButton.innerHTML = 'Mute call';
                muteCallButton.onclick = () => {
                    muteCall();
                };
                callStatus.appendChild(muteCallButton);
            }
        } catch (err) {
            throw err;
        }
    };

    // **** EVENT HANDLERS
    function onPresenceChanged(event) {
        console.log('RAINBOW ON PRESENCE CHANGED', event.detail);
        const connectedUserPresence = document.getElementById('connectedUserPresence');
        connectedUserPresence.innerHTML = event.detail.status;
    }

    function onContactRichPresenceChanged(event) {
        console.log('RAINBOW ON CONTACT RICH PRESENCE CHANGED', event.detail);
        updateContactCard(event.detail);
    }

    function onWebRTCErrorHandled(event) {
        let errorSDK = event.detail;
        // event.detail contains an Error object
        console.log('WebRTC ERROR', errorSDK);
    }

    function onWebRtcCallStateChanged(event) {
        const call = event.detail;
        const callStatus = call.status.value;
        const callId = call.id;
        console.log('WebRTC call state changed', callStatus, callId, call);
        if (call.remoteMedia === 3 && callStatus === 'active') {
            rainbowSDK.webRTC.showLocalVideo();
        }
        updateCallStatus(call);
    }

    // **** SDK Listeners
    document.addEventListener(rainbowSDK.RAINBOW_ONREADY, onReady);
    document.addEventListener(rainbowSDK.RAINBOW_ONLOADED, onLoaded);
    document.addEventListener(rainbowSDK.connection.RAINBOW_ONSTARTED, onStarted);
    document.addEventListener(rainbowSDK.presence.RAINBOW_ONPRESENCECHANGED, onPresenceChanged);
    document.addEventListener(rainbowSDK.presence.RAINBOW_ONCONTACTRICHPRESENCECHANGED, onContactRichPresenceChanged);
    document.addEventListener(rainbowSDK.webRTC.RAINBOW_ONWEBRTCERRORHANDLED, onWebRTCErrorHandled);
    document.addEventListener(rainbowSDK.webRTC.RAINBOW_ONWEBRTCCALLSTATECHANGED, onWebRtcCallStateChanged);

    // **** Button listeners
    const loginButton = document.getElementById('loginButton');
    loginButton.addEventListener('click', rainbowLogin);

    // **** UI functions
    function updateCallStatus(call) {
        if (call && call.status.value !== 'Unknown') {
            state.call = call;
            const callStatus = document.getElementById('callStatus');
            callStatus.innerHTML = `
				<hr>
				Call status: ${call.status.value}
				<p>
				Call id: ${call.id}
				<p>
				Contact name: ${call.contact.fullname}
			`;

            // Add hang up button
            const releaseButton = document.createElement('button');
            releaseButton.innerHTML = 'Release call';
            releaseButton.id = 'releaseButton';
            releaseButton.onclick = () => {
                releaseCall();
            };
            callStatus.appendChild(releaseButton);

            // If it's an incoming call, add answer button
            if (call.status.value === 'incommingCall' && call.remoteMedia === 1) {
                // REMOTE MEDIA === 1 means it's an Audio-only call. We can answer it only in Audio.
                const answerInAudioButton = document.createElement('button');
                answerInAudioButton.innerHTML = 'Answer in Audio';
                answerInAudioButton.id = 'answerInAudioButton';
                answerInAudioButton.onclick = () => {
                    answerInAudio();
                };
                callStatus.appendChild(answerInAudioButton);
            } else if (call.status.value === 'incommingCall' && call.remoteMedia === 3) {
                // REMOTE MEDIA === 1 means it's a Video call. We can answer it in audio and in video
                const answerInAudioButton = document.createElement('button');
                answerInAudioButton.innerHTML = 'Answer in Audio';
                answerInAudioButton.id = 'answerInAudioButton';
                answerInAudioButton.onclick = () => {
                    answerInAudio();
                };

                const answerInVideoButton = document.createElement('button');
                answerInVideoButton.innerHTML = 'Answer in Video';
                answerInVideoButton.id = 'answerInVideoButton';
                answerInVideoButton.onclick = () => {
                    answerInVideo();
                };

                callStatus.appendChild(answerInAudioButton);
                callStatus.appendChild(answerInVideoButton);
            } else if (call.status.value !== 'incommingCall') {
                const answerInVideoButton = document.getElementById('answerInVideoButton');
                const answerInAudioButton = document.getElementById('answerInAudioButton');

                if (answerInVideoButton) {
                    callStatus.removeChild(answerInVideoButton);
                }
                if (answerInAudioButton) {
                    callStatus.removeChild(answerInVideoButton);
                }
            }

            //Show mute/unmute buttons
            if (call.status.value === 'active' && !state.isMuted) {
                const unmuteCallButton = document.getElementById('unmuteCallButton');
                if (unmuteCallButton) {
                    unmuteCallButton.parentNode.removeChild(unmuteCallButton);
                }
                const muteCallButton = document.createElement('button');
                muteCallButton.id = 'muteCallButton';
                muteCallButton.innerHTML = 'Mute call';
                muteCallButton.onclick = () => {
                    muteCall();
                };
                callStatus.appendChild(muteCallButton);
            } else if (call.status.value === 'active' && state.isMuted) {
                const muteCallButton = document.getElementById('muteCallButton');
                if (muteCallButton) {
                    muteCallButton.parentNode.removeChild(muteCallButton);
                }
                const unmuteCallButton = document.createElement('button');
                unmuteCallButton.id = 'unmuteCallButton';
                unmuteCallButton.innerHTML = 'Unmute call';
                unmuteCallButton.onclick = () => {
                    unmuteCall();
                };
                callStatus.appendChild(unmuteCallButton);
            }
        } else {
            state.call = null;
            const callStatus = document.getElementById('callStatus');
            const releaseButton = document.getElementById('releaseButton');
            if (callStatus && releaseButton) {
                callStatus.removeChild(releaseButton);
                callStatus.innerHTML = '';
            }
        }
    }

    function updateContactCard(contact) {
        const contactCardStatus = document.getElementById('contactStatus-' + contact.id);
        if (contactCardStatus) {
            contactCardStatus.innerHTML = contact.status;
        }

        const contactCallAudioButton = document.getElementById('contactCallAudio-' + contact.id);
        const contactCallSharingButton = document.getElementById('contactCallSharing-' + contact.id);
        const contactCallVideoButton = document.getElementById('contactCallVideo-' + contact.id);
        if ((contact.status === 'online' || contact.status === 'away') && !state.call && state.canMakeAudioVideoCall && state.hasACamera) {
            if (contactCallAudioButton) {
                contactCallAudioButton.disabled = false;
            }
            if (contactCallSharingButton) {
                contactCallSharingButton.disabled = false;
            }
            if (contactCallVideoButton) {
                contactCallVideoButton.disabled = false;
            }
        } else {
            if (contactCallAudioButton) {
                contactCallAudioButton.disabled = true;
            }
            if (contactCallSharingButton) {
                contactCallSharingButton.disabled = true;
            }
            if (contactCallVideoButton) {
                contactCallVideoButton.disabled = true;
            }
        }
    }

    function createContactCard(contact) {
        let contactCard = document.createElement('div');
        let contactName = document.createElement('div');
        let contactStatus = document.createElement('div');

        // Create "Audio Call" button
        let contactCallAudio = document.createElement('button');
        contactCallAudio.innerHTML = 'Audio Call';
        contactCallAudio.id = 'contactCallAudio-' + contact.id;
        contactCallAudio.contactId = contact.id;
        contactCallAudio.onclick = () => {
            callInAudio(contact.id);
        };
        contactCallAudio.disabled =
            (contact.status === 'online' || contact.status === 'away') && !state.call && state.canMakeAudioVideoCall && state.hasACamera
                ? false
                : true;

        // Create "Sharing Call" button
        let contactCallSharing = document.createElement('button');
        contactCallSharing.innerHTML = 'Sharing Call';
        contactCallSharing.id = 'contactCallSharing-' + contact.id;
        contactCallSharing.contactId = contact.id;
        contactCallSharing.onclick = () => {
            callInSharing(contact.id);
        };
        contactCallSharing.disabled =
            (contact.status === 'online' || contact.status === 'away') && !state.call && state.canMakeAudioVideoCall && state.hasACamera
                ? false
                : true;

        // Create "Video Call" button
        let contactCallVideo = document.createElement('button');
        contactCallVideo.innerHTML = 'Video Call';
        contactCallVideo.id = 'contactCallVideo-' + contact.id;
        contactCallVideo.contactId = contact.id;
        contactCallVideo.onclick = () => {
            callInVideo(contact.id);
        };
        contactCallVideo.disabled =
            (contact.status === 'online' || contact.status === 'away') && !state.call && state.canMakeAudioVideoCall && state.hasACamera
                ? false
                : true;

        contactName.innerHTML = contact.fullname;
        contactName.className = 'contactCard-contactName';
        contactStatus.innerHTML = contact.status;
        contactStatus.className = 'contactCard-contactStatus';
        contactCard.className = 'contactCard';
        contactCard.id = 'contact-' + contact.id;
        contactStatus.id = 'contactStatus-' + contact.id;

        contactCard.appendChild(contactName);
        contactCard.appendChild(contactStatus);
        contactCard.appendChild(contactCallAudio);
        contactCard.appendChild(contactCallSharing);
        contactCard.appendChild(contactCallVideo);
        return contactCard;
    }

    function updateUserDetails() {
        // the login form is no longer needed
        document.getElementById('loginForm').style.display = 'none';

        // get connected user details
        config.connectedUser = rainbowSDK.contacts.getConnectedUser();
        console.log(config.connectedUser);

        const connectedUserName = document.getElementById('connectedUserName');
        connectedUserName.innerHTML = `<h3>${config.connectedUser.fullname}</h3><hr>`;

        const connectedUserId = document.getElementById('connectedUserId');
        connectedUserId.innerHTML = config.connectedUser.id;

        const userDetails = document.getElementById('userDetails');
        // Show avatar
        if (config.connectedUser.avatar) {
            const avatar = document.createElement('img');
            avatar.src = config.connectedUser.avatar;
            avatar.style.width = '50%';
            avatar.style.height = 'auto';
            avatar.style.borderRadius = '50%';
            avatar.id = 'avatarPicture';
            userDetails.appendChild(avatar);
        }

        // Add signOut button
        let signOutButton = document.createElement('button');
        signOutButton.innerHTML = 'Sign out';
        signOutButton.id = 'signOutButton';
        signOutButton.onclick = () => {
            signOut();
        };

        userDetails.appendChild(signOutButton);
    }

    // **** Start the SDK
    rainbowSDK.start();
    rainbowSDK.load({ verboseLog: false });
})();
