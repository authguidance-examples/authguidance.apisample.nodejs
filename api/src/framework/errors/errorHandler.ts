import {ApiLogger} from '../utilities/apiLogger';
import {ApiError} from './apiError';
import {ClientError} from './clientError';

/*
 * A class to handle composing and reporting errors
 */
export class ErrorHandler {

    /*
     * Handle the server error and get client details
     */
    public static handleError(exception: any): ClientError {

        // TODO: Update to standard error handling

        // Ensure that the exception has a known type
        const handledError = ErrorHandler.fromException(exception);
        if (exception instanceof ClientError) {

            // Client errors mean the caller did something wrong
            const clientError = handledError as ClientError;

            // Log the error unless it is a token expired error
            if (clientError.statusCode !== 401) {
                const errorToLog = clientError.toLogFormat();
                ApiLogger.error(JSON.stringify(errorToLog));
            }

            // Return the API response to the caller
            return clientError;

        } else {

            // API errors mean we experienced a failure
            const apiError = handledError as ApiError;

            // Log the error with an id
            const errorToLog = apiError.toLogFormat();
            ApiLogger.error(JSON.stringify(errorToLog));

            // Return the API response to the caller
            return apiError.toClientError();
        }
    }

    /*
     * Ensure that all errors are of a known type
     */
    public static fromException(exception: any): ApiError | ClientError {

        // Already handled 500 errors
        if (exception instanceof ApiError) {
            return exception;
        }

        // Already handled 4xx errors
        if (exception instanceof ClientError) {
            return exception;
        }

        // Handle general exceptions
        const apiError = new ApiError('general_exception', 'An unexpected exception occurred in the API');
        apiError.details = this._getExceptionDetails(exception);
        apiError.stack = exception.stack;
        return apiError;
    }

    /*
     * Handle the request promise error for metadata lookup failures
     */
    public static fromMetadataError(responseError: any, url: string): ApiError {

        // TODO: Intermittent RequestError due to Okta alt certificate names not reported correctly

        const apiError = new ApiError('metadata_lookup_failure', 'Metadata lookup failed');
        ErrorHandler._updateErrorFromHttpResponse(apiError, url, responseError);
        return apiError;
    }

    /*
     * Handle the request promise error for introspection failures
     */
    public static fromIntrospectionError(responseError: any, url: string): ApiError {

        // Avoid reprocessing
        if (responseError instanceof ApiError) {
            return responseError;
        }

        const apiError = new ApiError('introspection_failure', 'Token validation failed');
        ErrorHandler._updateErrorFromHttpResponse(apiError, url, responseError);
        return apiError;
    }

    /*
     * Handle user info lookup failures
     */
    public static fromUserInfoError(responseError: any, url: string): ApiError {

        // Avoid reprocessing
        if (responseError instanceof ApiError) {
            return responseError;
        }

        const apiError = new ApiError('userinfo_failure', 'User info lookup failed');
        ErrorHandler._updateErrorFromHttpResponse(apiError, url, responseError);
        return apiError;
    }

    /*
     * The error thrown if we cannot find an expected claim during OAuth processing
     */
    public static fromMissingClaim(claimName: string): ApiError {

        const apiError = new ApiError('claims_failure', 'Authorization Data Not Found');
        apiError.details = `An empty value was found for the expected claim ${claimName}`;
        return apiError;
    }

    /*
     * Update error fields with OAuth response details
     */
    private static _updateErrorFromHttpResponse(
        apiError: ApiError,
        url: string,
        responseError: any): void {

        if (responseError.error && responseError.error_description) {

            // Include OAuth error details if returned
            apiError.message += ` : ${responseError.error}`;
            apiError.details = responseError.error_description;
        } else {

            // Otherwise capture exception details
            apiError.details = this._getExceptionDetails(responseError);
        }

        // Include the URL in the error details
        apiError.details += `, URL: ${url}`;
    }

    /*
     * Given an exception try to return a good string representation
     */
    private static _getExceptionDetails(exception: any): string {

        if (exception.message) {
            return exception.message;
        } else {
            return exception.toString();
        }
    }
}
