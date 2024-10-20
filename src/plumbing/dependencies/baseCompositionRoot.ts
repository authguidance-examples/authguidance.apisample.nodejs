import {Container} from 'inversify';
import {ClaimsCache} from '../claims/claimsCache.js';
import {ClaimsPrincipal} from '../claims/claimsPrincipal.js';
import {ExtraClaimsProvider} from '../claims/extraClaimsProvider.js';
import {LoggingConfiguration} from '../configuration/loggingConfiguration.js';
import {OAuthConfiguration} from '../configuration/oauthConfiguration.js';
import {BASETYPES} from '../dependencies/baseTypes.js';
import {LogEntry} from '../logging/logEntry.js';
import {LoggerFactory} from '../logging/loggerFactory.js';
import {UnhandledExceptionHandler} from '../middleware/unhandledExceptionHandler.js';
import {AccessTokenValidator} from '../oauth/accessTokenValidator.js';
import {JwksRetriever} from '../oauth/jwksRetriever.js';
import {OAuthFilter} from '../oauth/oauthFilter.js';
import {HttpProxy} from '../utilities/httpProxy.js';

/*
 * A class to create and register common cross cutting concerns
 */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
export class BaseCompositionRoot {

    private readonly _container: Container;
    private _oauthConfiguration?: OAuthConfiguration;
    private _extraClaimsProvider?: ExtraClaimsProvider;
    private _loggingConfiguration?: LoggingConfiguration;
    private _loggerFactory?: LoggerFactory;
    private _exceptionHandler?: UnhandledExceptionHandler;
    private _httpProxy?: HttpProxy;

    public constructor(container: Container) {
        this._container = container;
    }

    /*
     * Indicate that we're using OAuth and receive the configuration
     */
    public useOAuth(oauthConfiguration: OAuthConfiguration): BaseCompositionRoot {
        this._oauthConfiguration = oauthConfiguration;
        return this;
    }

    /*
     * An object to provide extra claims when a new token is processed
     */
    public withExtraClaimsProvider(extraClaimsProvider: ExtraClaimsProvider): BaseCompositionRoot {
        this._extraClaimsProvider = extraClaimsProvider;
        return this;
    }

    /*
     * Receive the logging configuration so that we can create objects related to logging and error handling
     */
    public withLogging(
        loggingConfiguration: LoggingConfiguration,
        loggerFactory: LoggerFactory): BaseCompositionRoot {

        this._loggingConfiguration = loggingConfiguration;
        this._loggerFactory = loggerFactory;
        return this;
    }

    /*
     * Receive the unhandled exception handler
     */
    public withExceptionHandler(exceptionHandler: UnhandledExceptionHandler): BaseCompositionRoot {

        this._exceptionHandler = exceptionHandler;
        return this;
    }

    /*
     * Apply HTTP proxy details for outgoing OAuth calls if configured
     */
    public withProxyConfiguration(useProxy: boolean, proxyUrl: string): BaseCompositionRoot {

        this._httpProxy = new HttpProxy(useProxy, proxyUrl);
        return this;
    }

    /*
     * Do the main builder work of registering dependencies
     */
    public register(): BaseCompositionRoot {

        this._registerBaseDependencies();
        this._registerOAuthDependencies();
        this._registerClaimsDependencies();
        return this;
    }

    /*
     * Register dependencies for logging and error handling
     */
    private _registerBaseDependencies(): void {

        // Singletons
        this._container.bind<UnhandledExceptionHandler>(BASETYPES.UnhandledExceptionHandler)
            .toConstantValue(this._exceptionHandler!);
        this._container.bind<LoggerFactory>(BASETYPES.LoggerFactory)
            .toConstantValue(this._loggerFactory!);
        this._container.bind<LoggingConfiguration>(BASETYPES.LoggingConfiguration)
            .toConstantValue(this._loggingConfiguration!);
        this._container.bind<HttpProxy>(BASETYPES.HttpProxy)
            .toConstantValue(this._httpProxy!);

        // Register a per request dummy value that is overridden by the logger middleware later
        this._container.bind<LogEntry>(BASETYPES.LogEntry)
            .toConstantValue({} as any);
    }

    /*
     * Register OAuth depencencies
     */
    private _registerOAuthDependencies(): void {

        // Make the configuration injectable
        this._container.bind<OAuthConfiguration>(BASETYPES.OAuthConfiguration)
            .toConstantValue(this._oauthConfiguration!);

        // A class to validate JWT access tokens
        this._container.bind<AccessTokenValidator>(BASETYPES.AccessTokenValidator)
            .to(AccessTokenValidator).inRequestScope();

        // The filter deals with finalizing the claims principal
        this._container.bind<OAuthFilter>(BASETYPES.OAuthFilter)
            .to(OAuthFilter).inRequestScope();

        // Also register a singleton to cache token signing public keys
        this._container.bind<JwksRetriever>(BASETYPES.JwksRetriever)
            .toConstantValue(new JwksRetriever(this._oauthConfiguration!, this._httpProxy!));
    }

    /*
     * Register claims related depencencies
     */
    private _registerClaimsDependencies(): void {

        // Register the singleton cache
        const claimsCache = new ClaimsCache(
            this._oauthConfiguration!.claimsCacheTimeToLiveMinutes,
            this._extraClaimsProvider!,
            this._loggerFactory!);
        this._container.bind<ClaimsCache>(BASETYPES.ClaimsCache)
            .toConstantValue(claimsCache);

        // Register the extra claims provider
        this._container.bind<ExtraClaimsProvider>(BASETYPES.ExtraClaimsProvider)
            .toConstantValue(this._extraClaimsProvider!);

        // Register dummy per request claims that are overridden later by the authorizer middleware
        this._container.bind<ClaimsPrincipal>(BASETYPES.ClaimsPrincipal)
            .toConstantValue({} as any);
    }
}
