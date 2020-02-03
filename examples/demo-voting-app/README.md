# Demo voting application

This application provides a complete example of integrating with the Kambani extension by simulating a vote for the
current best football player.

The features demonstrated in this application are:

* accessing the FCT & EC keys stored in Kambani
* monitoring changes to the FCT & EC keys
* sending a data signing request to Kambani, which should be signed by an FCT, EC or DID key

The logic of the application is in `js/index.js` and this file can be modified to experiment with different request types
and their behavior. Check the comments in the file for more explanations.

The HTML page is designed to show changes to FCT & EC addresses as well as the responses returned by Kambani to the incoming
signature requests.

To run the application **you need a `localhost` server**. If you have Python3 installed, you can run: `python -m http.server`
from the project root directory and access the application at `https://localhost:8000`.
