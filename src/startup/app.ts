import * as fs from 'fs-extra';
import {Container} from 'inversify';
import 'reflect-metadata';
import {Configuration} from '../configuration/configuration';
import {DebugProxyAgent, LoggerFactoryBuilder} from '../framework';
import {HttpServerConfiguration} from './httpServerConfiguration';

/*
 * The application entry point
 */
(async () => {

    // Create initial objects
    const loggerFactory = LoggerFactoryBuilder.Create();
    const container = new Container();

    try {

        // Load our JSON configuration and configure log levels
        const configurationBuffer = fs.readFileSync('api.config.json');
        const configuration = JSON.parse(configurationBuffer.toString()) as Configuration;
        loggerFactory.configure(configuration.framework);

        // Initialize HTTP debugging
        DebugProxyAgent.initialize(configuration.api.useProxy, configuration.api.proxyUrl);

        // Configure the API behaviour at startup
        const httpServer = new HttpServerConfiguration(configuration, container, loggerFactory);
        await httpServer.configure();
        httpServer.start();

    } catch (e) {

        // Report startup errors
        loggerFactory.logStartupError(e);
    }
})();
