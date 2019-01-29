import {NextFunction, Request, Response} from 'express';
import {Configuration} from '../configuration/configuration';
import {ErrorHandler} from '../plumbing/errors/errorHandler';
import {Authenticator} from '../plumbing/oauth/authenticator';
import {ClaimsMiddleware} from '../plumbing/oauth/claimsMiddleware';
import {JsonReader} from '../plumbing/utilities/jsonReader';
import {ResponseWriter} from '../plumbing/utilities/responseWriter';
import {AuthorizationRulesRepository} from './authorizationRulesRepository';
import {CompanyController} from './companyController';
import {CompanyRepository} from './companyRepository';

/*
 * An entry point to handle API requests using Express request and response objects
 */
export class WebApi {

    /*
     * Injected dependencies
     */
    private _apiConfig: Configuration;

    /*
     * Class setup
     */
    public constructor(apiConfig: Configuration) {

        this._apiConfig = apiConfig;
        this._setupCallbacks();
    }

    /*
     * The entry point for authorization and claims handling
     */
    public async authorizationHandler(
        request: Request,
        response: Response,
        next: NextFunction): Promise<void> {

        try {

            // Create the middleware instance and its dependencies on every API request
            const authenticator = new Authenticator(this._apiConfig.oauth);
            const authorizationRulesRepository = new AuthorizationRulesRepository();
            const middleware = new ClaimsMiddleware(authenticator, authorizationRulesRepository);

            // Do the work
            const authorized = await middleware.authorizeRequestAndSetClaims(request, response, next);

            // Only move to the API operation if authorized
            if (authorized) {
                next();
            }

        } catch (e) {
            this.unhandledExceptionHandler(e, request, response);
        }
    }

    /*
     * Return the user info claims from authorization
     */
    public async getUserClaims(
        request: Request,
        response: Response,
        next: NextFunction): Promise<void> {

        return response.locals.claims.userInfo;
    }

    /*
     * Return a list of companies
     */
    public async getCompanyList(
        request: Request,
        response: Response,
        next: NextFunction): Promise<void> {

        try {
            // Create the controller instance and its dependencies on every API request
            const reader = new JsonReader();
            const repository = new CompanyRepository(response.locals.claims, reader);
            const controller = new CompanyController(repository);

            // Get the data and return it in the response
            const result = await controller.getCompanyList();
            ResponseWriter.writeObject(response, 200, result);

        } catch (e) {
            this.unhandledExceptionHandler(e, request, response);
        }
    }

    /*
     * Return company transactions
     */
    public async getCompanyTransactions(
        request: Request,
        response: Response,
        next: NextFunction): Promise<void> {

        try {
            // Create the controller instance and its dependencies on every API request
            const reader = new JsonReader();
            const repository = new CompanyRepository(response.locals.claims, reader);
            const controller = new CompanyController(repository);

            // Get the data and return it in the response
            const id = parseInt(request.params.id, 10);
            const result = await controller.getCompanyTransactions(id);
            ResponseWriter.writeObject(response, 200, result);

        } catch (e) {
            this.unhandledExceptionHandler(e, request, response);
        }
    }

    /*
     * The entry point for handling exceptions forwards all exceptions to our handler class
     */
    public unhandledExceptionHandler(
        unhandledException: any,
        request: Request,
        response: Response): void {

        const clientError = ErrorHandler.handleError(unhandledException);
        ResponseWriter.writeObject(response, clientError.statusCode, clientError.toResponseFormat());
    }

    /*
     * Set up async callbacks
     */
    private _setupCallbacks(): void {
        this.authorizationHandler = this.authorizationHandler.bind(this);
        this.getUserClaims = this.getUserClaims.bind(this);
        this.getCompanyList = this.getCompanyList.bind(this);
        this.getCompanyTransactions = this.getCompanyTransactions.bind(this);
        this.unhandledExceptionHandler = this.unhandledExceptionHandler.bind(this);
    }
}
