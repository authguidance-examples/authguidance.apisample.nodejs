import ErrorHandler from './errorHandler';
import UIError from './uiError';
import * as $ from 'jquery';

/*
 * Logic related to making HTTP calls
 */
export default class HttpClient {
    
    /*
     * Download JSON data from the app config file
     */
    public static async loadAppConfiguration(filePath: string): Promise<any> {
        
        try {
            // Make the call
            return await $.ajax({
                    url: filePath,
                    type: 'GET',
                    dataType: 'json'
                });
        }
        catch(xhr) {
            // Improve the default error message
            throw ErrorHandler.getFromAjaxError(xhr, filePath);
        }
    }
    
    /*
     * Get data from an API URL and handle retries if needed
     */
    public static async callApi(url: string, method: string, dataToSend: any, authenticator: any): Promise<any> {
        
        // Get a token, which will log the user in if needed
        let token = await authenticator.getAccessToken();
        
        try {
            // Call the API
            return await HttpClient._callApiWithToken(url, method, dataToSend, token);
        }
        catch (xhr1) {
            
            // Report Ajax errors if this is not a 401
            if (xhr1.status !== 401) {
                let ajaxError = ErrorHandler.getFromAjaxError(xhr1, url);
                throw ajaxError;
            }

            // If we received a 401 then clear the failing access token from storage and get a new one
            await authenticator.clearAccessToken();
            let token = await authenticator.getAccessToken();

            try {
                // Call the API again
                return await HttpClient._callApiWithToken(url, method, dataToSend, token);
            }
            catch (xhr2) {
                // Report Ajax errors for the retry
                let ajaxError = ErrorHandler.getFromAjaxError(xhr2, url);
                throw ajaxError;
            }
        }
    }
    
    /*
     * Do the work of calling the API
     */
    private static async _callApiWithToken(url: string, method: string, dataToSend: any, accessToken: string): Promise<any> {
        
        let dataToSendText = JSON.stringify(dataToSend | <any>{});
        
        return await $.ajax({
                    url: url,
                    data: dataToSendText,
                    dataType: 'json',
                    contentType: 'application/json',
                    type: method,
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader ('Authorization', 'Bearer ' + accessToken);
                    }
                });
    }
}