# Rainbow SDK for Web

## Preamble

The Rainbow SDK (Software Development Kit) for Web is a JavaScript library that works on all modern browsers (Chrome, Firefox, Safari and Edge). Its powerful APIs enable you to create the best applications that connect to the Rainbow Cloud Services.

For more information visit hub.openrainbow.com

## Rainbow Web SDK WebRTC sample

This demo is provided "as is" without support.

This demo demonstrates the use of the following Rainbow SDK for Web APIs:

-   Connection Service: The demo shows how to use these APIs to connect to Rainbow

-   Contacts and Presence Services: Using these services, the demo shows how to retrieve the information from the contacts

-   WebRTC Service: Using these APIs, the demo shows how to select the device to use and how to make an audio video call to a contact

## Starting the demo

Before running any of the files mentioned below, run `npm install` in the root folder. That will install the latest version of Rainbow Web SDK along with the basic http-server.

Then run `npm run build` to copy the SDK files in the right directory.

Once this is done, update the `applicationID` and `applicationSecret` variables in `src/script.js` file. If you don't know where can you get your Application ID and Application Secret from, check our [guide](https://hub.openrainbow.com/#/documentation/doc/sdk/web/guides/Adding_id_and_secret_key).

You will need to create a SSL certificate in order to run a secure local server. In order to do it, navigate to the projects' root folder and run:

`openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem`

Then, depending on your operating system, run the following command in the root folder:

-   Linux/MacOS: `npm run start`
-   Windows: `npm run start-win`

That should start a HTTP server and open your browser on `https://localhost:8887/`.
