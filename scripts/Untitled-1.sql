-- ============================================================
-- STREAMDB - Script completo con datos realistas
-- Actividad 1, U2: Índices en SQL Server
-- ============================================================

-- ============================================================
-- PASO 1: CREAR BASE DE DATOS
-- ============================================================
CREATE DATABASE StreamDB;
GO
USE StreamDB;
GO

-- ============================================================
-- PASO 2: CREAR TABLAS
-- ============================================================

CREATE TABLE Usuarios (
    UsuarioID     INT IDENTITY(1,1) PRIMARY KEY,
    NombreUsuario VARCHAR(50)  NOT NULL,
    Email         VARCHAR(100) NOT NULL,
    FechaRegistro DATE         NOT NULL DEFAULT GETDATE(),
    Pais          VARCHAR(50)  NOT NULL
);

CREATE TABLE Categorias (
    CategoriaID     INT IDENTITY(1,1) PRIMARY KEY,
    NombreCategoria VARCHAR(60) NOT NULL,
    Descripcion     VARCHAR(200)
);

CREATE TABLE Canales (
    CanalID       INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioID     INT          NOT NULL,
    NombreCanal   VARCHAR(80)  NOT NULL,
    Descripcion   VARCHAR(300),
    Seguidores    INT          NOT NULL DEFAULT 0,
    FechaCreacion DATE         NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID)
);

CREATE TABLE Streams (
    StreamID        INT IDENTITY(1,1) PRIMARY KEY,
    CanalID         INT          NOT NULL,
    CategoriaID     INT          NOT NULL,
    Titulo          VARCHAR(150) NOT NULL,
    FechaInicio     DATETIME     NOT NULL,
    FechaFin        DATETIME     NULL,
    EspectadoresMax INT          NOT NULL DEFAULT 0,
    DuracionMin     INT          NULL,
    FOREIGN KEY (CanalID)     REFERENCES Canales(CanalID),
    FOREIGN KEY (CategoriaID) REFERENCES Categorias(CategoriaID)
);

CREATE TABLE Donaciones (
    DonacionID    INT IDENTITY(1,1) PRIMARY KEY,
    StreamID      INT            NOT NULL,
    UsuarioID     INT            NOT NULL,
    Monto         DECIMAL(10,2)  NOT NULL,
    Mensaje       VARCHAR(200),
    FechaDonacion DATETIME       NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (StreamID)  REFERENCES Streams(StreamID),
    FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID)
);
GO

PRINT '>>> Tablas creadas exitosamente';
GO

-- ============================================================
-- PASO 3: TABLAS AUXILIARES PARA DATOS REALISTAS
-- ============================================================

-- Nombres reales
CREATE TABLE #Nombres (ID INT IDENTITY(1,1), Nombre VARCHAR(30));
INSERT INTO #Nombres (Nombre) VALUES
('Santiago'),('Valentina'),('Mateo'),('Sofia'),('Sebastian'),
('Isabella'),('Diego'),('Camila'),('Nicolas'),('Mariana'),
('Alejandro'),('Daniela'),('Andres'),('Gabriela'),('Carlos'),
('Fernanda'),('Miguel'),('Andrea'),('Daniel'),('Paula'),
('Luis'),('Maria'),('Jorge'),('Ana'),('Fernando'),
('Laura'),('Ricardo'),('Elena'),('Pablo'),('Carmen'),
('Eduardo'),('Lucia'),('Rodrigo'),('Natalia'),('Emilio'),
('Valeria'),('Adrian'),('Monica'),('Ivan'),('Rosa'),
('Oscar'),('Patricia'),('Raul'),('Claudia'),('Hugo'),
('Diana'),('Marco'),('Alejandra'),('Sergio'),('Lorena');

-- Apellidos reales
CREATE TABLE #Apellidos (ID INT IDENTITY(1,1), Apellido VARCHAR(30));
INSERT INTO #Apellidos (Apellido) VALUES
('Garcia'),('Rodriguez'),('Martinez'),('Lopez'),('Hernandez'),
('Gonzalez'),('Perez'),('Sanchez'),('Ramirez'),('Torres'),
('Flores'),('Rivera'),('Gomez'),('Diaz'),('Reyes'),
('Morales'),('Cruz'),('Ortiz'),('Gutierrez'),('Chavez'),
('Ramos'),('Vargas'),('Castillo'),('Jimenez'),('Moreno'),
('Romero'),('Herrera'),('Medina'),('Aguilar'),('Vega'),
('Castro'),('Mendoza'),('Ruiz'),('Soto'),('Contreras'),
('Silva'),('Delgado'),('Fuentes'),('Espinoza'),('Cabrera'),
('Navarro'),('Campos'),('Molina'),('Dominguez'),('Suarez'),
('Rojas'),('Pena'),('Acosta'),('Valencia'),('Salazar');

-- Paises con pesos realistas
CREATE TABLE #Paises (ID INT IDENTITY(1,1), Pais VARCHAR(50));
INSERT INTO #Paises (Pais) VALUES
('Mexico'),('Mexico'),('Mexico'),('Colombia'),('Colombia'),
('Argentina'),('Argentina'),('Espana'),('Chile'),('Peru'),
('Ecuador'),('Venezuela'),('Guatemala'),('Cuba'),('Bolivia'),
('Rep. Dominicana'),('Honduras'),('Paraguay'),('El Salvador'),('Uruguay'),
('Estados Unidos'),('Estados Unidos'),('Brasil'),('Canada'),('Panama');

-- Dominios de email
CREATE TABLE #Dominios (ID INT IDENTITY(1,1), Dominio VARCHAR(30));
INSERT INTO #Dominios (Dominio) VALUES
('gmail.com'),('gmail.com'),('gmail.com'),('hotmail.com'),('hotmail.com'),
('outlook.com'),('outlook.com'),('yahoo.com'),('protonmail.com'),('icloud.com'),
('live.com'),('mail.com'),('zoho.com'),('aol.com'),('tutanota.com');

-- Prefijos de username estilo gaming/streaming
CREATE TABLE #Prefijos (ID INT IDENTITY(1,1), Prefijo VARCHAR(20));
INSERT INTO #Prefijos (Prefijo) VALUES
('xX'),('El'),('La'),('Dark'),('Pro'),
('Epic'),('Neo'),('Mr'),('Miss'),('Dr'),
('The'),('King'),('Queen'),('Sir'),('Lady'),
('Shadow'),('Fire'),('Ice'),('Storm'),('Wolf'),
('Nova'),('Pixel'),('Cyber'),('Turbo'),('Max');

-- Sufijos de username
CREATE TABLE #Sufijos (ID INT IDENTITY(1,1), Sufijo VARCHAR(20));
INSERT INTO #Sufijos (Sufijo) VALUES
('Gaming'),('TV'),('Live'),('Plays'),('HD'),
('Pro'),('YT'),('Stream'),('GG'),('XD'),
('Boss'),('God'),('Crack'),('Master'),('Legend'),
('_ttv'),('_gg'),('Oficial'),('Real'),('Plus'),
('Elite'),('Prime'),('Ultra'),('Ninja'),('Sniper');

GO

-- ============================================================
-- PASO 3a: INSERTAR 10,000 USUARIOS REALISTAS
-- ============================================================
DECLARE @i INT = 1;
DECLARE @totalNombres INT = 50;
DECLARE @totalApellidos INT = 50;
DECLARE @totalPaises INT = 25;
DECLARE @totalDominios INT = 15;
DECLARE @totalPrefijos INT = 25;
DECLARE @totalSufijos INT = 25;

WHILE @i <= 10000
BEGIN
    DECLARE @idNombre INT = (ABS(CHECKSUM(NEWID())) % @totalNombres) + 1;
    DECLARE @idApellido INT = (ABS(CHECKSUM(NEWID())) % @totalApellidos) + 1;
    DECLARE @idPais INT = (ABS(CHECKSUM(NEWID())) % @totalPaises) + 1;
    DECLARE @idDominio INT = (ABS(CHECKSUM(NEWID())) % @totalDominios) + 1;
    DECLARE @idPrefijo INT = (ABS(CHECKSUM(NEWID())) % @totalPrefijos) + 1;
    DECLARE @idSufijo INT = (ABS(CHECKSUM(NEWID())) % @totalSufijos) + 1;

    DECLARE @nombre VARCHAR(30), @apellido VARCHAR(30), @pais VARCHAR(50);
    DECLARE @dominio VARCHAR(30), @prefijo VARCHAR(20), @sufijo VARCHAR(20);

    SELECT @nombre = Nombre FROM #Nombres WHERE ID = @idNombre;
    SELECT @apellido = Apellido FROM #Apellidos WHERE ID = @idApellido;
    SELECT @pais = Pais FROM #Paises WHERE ID = @idPais;
    SELECT @dominio = Dominio FROM #Dominios WHERE ID = @idDominio;
    SELECT @prefijo = Prefijo FROM #Prefijos WHERE ID = @idPrefijo;
    SELECT @sufijo = Sufijo FROM #Sufijos WHERE ID = @idSufijo;

    DECLARE @username VARCHAR(50) = CONCAT(@prefijo, @nombre, @sufijo, CAST(@i AS VARCHAR));
    DECLARE @email VARCHAR(100) = CONCAT(LOWER(@nombre), '.', LOWER(@apellido), CAST(@i AS VARCHAR), '@', @dominio);

    INSERT INTO Usuarios (NombreUsuario, Email, FechaRegistro, Pais)
    VALUES (
        @username,
        @email,
        DATEADD(DAY, -ABS(CHECKSUM(NEWID())) % 1825, GETDATE()),
        @pais
    );
    SET @i = @i + 1;
END;
GO
PRINT '>>> 10,000 Usuarios insertados con datos realistas';
GO

-- ============================================================
-- PASO 3b: INSERTAR CATEGORIAS REALISTAS (estilo Twitch/Kick)
-- ============================================================
INSERT INTO Categorias (NombreCategoria, Descripcion) VALUES
('League of Legends', 'MOBA competitivo de Riot Games'),
('Valorant', 'Shooter tactico 5v5 de Riot Games'),
('Fortnite', 'Battle Royale de Epic Games'),
('Minecraft', 'Sandbox de construccion y supervivencia'),
('GTA V', 'Roleplay y aventuras en Los Santos'),
('Just Chatting', 'Conversaciones en vivo con la comunidad'),
('Call of Duty Warzone', 'Battle Royale de Activision'),
('Apex Legends', 'Battle Royale de Respawn Entertainment'),
('FIFA 25', 'Simulador de futbol de EA Sports'),
('Counter-Strike 2', 'Shooter competitivo de Valve'),
('Dota 2', 'MOBA competitivo de Valve'),
('World of Warcraft', 'MMORPG de Blizzard Entertainment'),
('Overwatch 2', 'Shooter de heroes de Blizzard'),
('Rocket League', 'Futbol con autos de Psyonix'),
('Among Us', 'Juego social de deduccion'),
('Genshin Impact', 'RPG de mundo abierto de miHoYo'),
('Dead by Daylight', 'Survival horror asimetrico'),
('Rust', 'Survival multijugador'),
('Escape from Tarkov', 'Shooter realista de supervivencia'),
('PUBG', 'Battle Royale de Krafton'),
('Musica y DJ', 'Sesiones musicales en vivo y DJ sets'),
('Arte y Creatividad', 'Dibujo digital, pintura y diseno'),
('Programacion', 'Desarrollo de software en vivo'),
('Cocina en Vivo', 'Recetas y cocina en directo'),
('IRL', 'Streams de la vida real y viajes'),
('ASMR', 'Audio relajante y ASMR en vivo'),
('Deportes', 'Comentarios y reacciones deportivas'),
('Poker', 'Torneos y partidas de poker'),
('Ajedrez', 'Partidas de ajedrez en vivo'),
('Fitness y Gym', 'Rutinas de ejercicio en directo'),
('Talk Shows', 'Entrevistas y debates en vivo'),
('Peliculas y Series', 'Watch parties y reacciones'),
('Speedrunning', 'Records de velocidad en videojuegos'),
('Retro Gaming', 'Juegos clasicos y nostalgicos'),
('Horror Games', 'Juegos de terror en vivo'),
('Mobile Gaming', 'Juegos para celular'),
('VTuber', 'Streaming con avatar virtual'),
('Educacion', 'Clases y tutoriales en vivo'),
('Ciencia y Tech', 'Divulgacion cientifica y tecnologia'),
('Cosplay', 'Creacion de cosplay en directo');
GO

-- Rellenar hasta 10,000 categorias variadas
DECLARE @j INT = 41;
DECLARE @generos TABLE (ID INT IDENTITY(1,1), Genero VARCHAR(40));
INSERT INTO @generos VALUES 
('Indie Games'),('Strategy'),('RPG'),('Fighting Games'),('Racing'),
('Simulation'),('Card Games'),('Puzzle'),('Platformer'),('Sandbox');

WHILE @j <= 10000
BEGIN
    DECLARE @generoID INT = (ABS(CHECKSUM(NEWID())) % 10) + 1;
    DECLARE @genero VARCHAR(40);
    SELECT @genero = Genero FROM @generos WHERE ID = @generoID;
    
    INSERT INTO Categorias (NombreCategoria, Descripcion)
    VALUES (
        CONCAT(@genero, ' #', @j),
        CONCAT('Subcategoria de ', @genero, ' - variante ', @j)
    );
    SET @j = @j + 1;
END;
GO
PRINT '>>> 10,000 Categorias insertadas con datos realistas';
GO

-- ============================================================
-- PASO 3c: INSERTAR 10,000 CANALES REALISTAS
-- ============================================================
DECLARE @k INT = 1;

-- Descripciones variadas para canales
DECLARE @descCanales TABLE (ID INT IDENTITY(1,1), Desc_ VARCHAR(200));
INSERT INTO @descCanales VALUES
('Bienvenidos a mi canal! Streams diarios de gaming y diversión'),
('Comunidad chill, buena vibra y juegos competitivos'),
('Streamer variety, jugamos de todo un poco'),
('Pro player compitiendo en torneos internacionales'),
('Contenido diario de entretenimiento y humor'),
('Canal dedicado al gaming competitivo y ranked'),
('Musica, arte y buenas conversaciones'),
('Speedrunner profesional, records mundiales'),
('Comunidad latina de gaming, unete!'),
('Streams nocturnos, terror y misterio'),
('Creador de contenido y desarrollador indie'),
('Just Chatting y reacciones a videos virales'),
('Canal de roleplay y narrativas inmersivas'),
('Gameplay relajado con la mejor musica lo-fi'),
('Torneos semanales con premios para la comunidad'),
('Canal educativo de programacion y tecnologia'),
('Fitness gaming - ejercicio mientras jugamos'),
('Reviews y primeras impresiones de juegos nuevos'),
('Cosplay, anime y cultura geek'),
('VTuber latino, aventuras virtuales diarias');

WHILE @k <= 10000
BEGIN
    DECLARE @descID INT = (ABS(CHECKSUM(NEWID())) % 20) + 1;
    DECLARE @descCanal VARCHAR(200);
    SELECT @descCanal = Desc_ FROM @descCanales WHERE ID = @descID;
    
    DECLARE @nombreCanal VARCHAR(80);
    DECLARE @estilo INT = ABS(CHECKSUM(NEWID())) % 6;
    
    SET @nombreCanal = CASE @estilo
        WHEN 0 THEN CONCAT('Canal_', 
            (SELECT TOP 1 Nombre FROM #Nombres ORDER BY NEWID()), '_',
            (SELECT TOP 1 Sufijo FROM #Sufijos ORDER BY NEWID()))
        WHEN 1 THEN CONCAT(
            (SELECT TOP 1 Prefijo FROM #Prefijos ORDER BY NEWID()),
            (SELECT TOP 1 Nombre FROM #Nombres ORDER BY NEWID()), 
            CAST(ABS(CHECKSUM(NEWID())) % 999 AS VARCHAR))
        WHEN 2 THEN CONCAT(
            (SELECT TOP 1 Nombre FROM #Nombres ORDER BY NEWID()), '_',
            (SELECT TOP 1 Apellido FROM #Apellidos ORDER BY NEWID()), '_tv')
        WHEN 3 THEN CONCAT('Live_',
            (SELECT TOP 1 Nombre FROM #Nombres ORDER BY NEWID()),
            (SELECT TOP 1 Sufijo FROM #Sufijos ORDER BY NEWID()))
        WHEN 4 THEN CONCAT(
            (SELECT TOP 1 Prefijo FROM #Prefijos ORDER BY NEWID()), '_',
            (SELECT TOP 1 Apellido FROM #Apellidos ORDER BY NEWID()),
            CAST(ABS(CHECKSUM(NEWID())) % 99 AS VARCHAR))
        ELSE CONCAT(
            (SELECT TOP 1 Nombre FROM #Nombres ORDER BY NEWID()),
            (SELECT TOP 1 Sufijo FROM #Sufijos ORDER BY NEWID()),
            '_', CAST(ABS(CHECKSUM(NEWID())) % 9999 AS VARCHAR))
    END;

    -- Seguidores con distribucion realista (pocos tienen muchos)
    DECLARE @seguidores INT;
    DECLARE @tier INT = ABS(CHECKSUM(NEWID())) % 100;
    SET @seguidores = CASE
        WHEN @tier < 50 THEN ABS(CHECKSUM(NEWID())) % 500          -- 50% tienen 0-500
        WHEN @tier < 80 THEN 500 + ABS(CHECKSUM(NEWID())) % 4500   -- 30% tienen 500-5000
        WHEN @tier < 95 THEN 5000 + ABS(CHECKSUM(NEWID())) % 45000 -- 15% tienen 5k-50k
        ELSE 50000 + ABS(CHECKSUM(NEWID())) % 950000                -- 5% tienen 50k-1M
    END;

    INSERT INTO Canales (UsuarioID, NombreCanal, Descripcion, Seguidores, FechaCreacion)
    VALUES (
        ((@k - 1) % 10000) + 1,
        CONCAT(@nombreCanal, '_', @k),
        @descCanal,
        @seguidores,
        DATEADD(DAY, -ABS(CHECKSUM(NEWID())) % 1825, GETDATE())
    );
    SET @k = @k + 1;
END;
GO
PRINT '>>> 10,000 Canales insertados con datos realistas';
GO

-- ============================================================
-- PASO 3d: INSERTAR 10,000 STREAMS REALISTAS
-- ============================================================
DECLARE @m INT = 1;

DECLARE @titulosBase TABLE (ID INT IDENTITY(1,1), Titulo VARCHAR(80));
INSERT INTO @titulosBase VALUES
('Ranked hasta Diamante o me rapo'),
('TORNEO $500 USD - Dia de clasificacion'),
('Chill stream con musica lofi y gaming'),
('Subathon 24 HORAS - Cada sub = 1 min mas'),
('Primer gameplay del nuevo update'),
('Reaccionando a los mejores clips del mes'),
('Competitivo SERIO - Road to Global'),
('Just Chatting nocturno con la comunidad'),
('Speedrun Any% - Intentando nuevo record'),
('Probando juego nuevo que salio hoy'),
('ESPECIAL 1000 SUBS - Sorteo al final'),
('Practicando para el torneo del sabado'),
('Stream relajado - preguntas y respuestas'),
('HARDCORE MODE - Si muero, borro el mundo'),
('Aprendiendo a jugar con viewers'),
('Maraton de terror - juegos de miedo toda la noche'),
('Retos de la comunidad en vivo'),
('Coaching gratis para suscriptores'),
('Drops activados - Consegui tu loot gratis'),
('Artes y manualidades en directo'),
('Unboxing y review de setup nuevo'),
('Cocinando recetas de la comunidad'),
('Charlando sobre las noticias del dia'),
('Analizando el meta actual del juego'),
('Showmatch contra otro streamer'),
('Jugando con suscriptores - unete!'),
('Mapa personalizado de la comunidad'),
('Primera vez jugando este juego'),
('Tier list definitiva con la chat'),
('ASMR Gaming - volumen bajito');

WHILE @m <= 10000
BEGIN
    DECLARE @tituloID INT = (ABS(CHECKSUM(NEWID())) % 30) + 1;
    DECLARE @tituloBase VARCHAR(80);
    SELECT @tituloBase = Titulo FROM @titulosBase WHERE ID = @tituloID;

    DECLARE @inicioStream DATETIME = DATEADD(HOUR, -ABS(CHECKSUM(NEWID())) % 8760, GETDATE());
    DECLARE @duracion INT = CASE 
        WHEN ABS(CHECKSUM(NEWID())) % 100 < 10 THEN 30 + ABS(CHECKSUM(NEWID())) % 60       -- 10% streams cortos 30-90min
        WHEN ABS(CHECKSUM(NEWID())) % 100 < 70 THEN 90 + ABS(CHECKSUM(NEWID())) % 180      -- 60% streams medios 1.5-4.5h
        WHEN ABS(CHECKSUM(NEWID())) % 100 < 95 THEN 270 + ABS(CHECKSUM(NEWID())) % 210     -- 25% streams largos 4.5-8h
        ELSE 480 + ABS(CHECKSUM(NEWID())) % 960                                              -- 5% maratones 8-24h
    END;

    -- Espectadores con distribucion realista
    DECLARE @espectadores INT;
    DECLARE @tierViews INT = ABS(CHECKSUM(NEWID())) % 100;
    SET @espectadores = CASE
        WHEN @tierViews < 60 THEN ABS(CHECKSUM(NEWID())) % 50        -- 60% tienen 0-50 viewers
        WHEN @tierViews < 85 THEN 50 + ABS(CHECKSUM(NEWID())) % 450  -- 25% tienen 50-500
        WHEN @tierViews < 97 THEN 500 + ABS(CHECKSUM(NEWID())) % 4500 -- 12% tienen 500-5000
        ELSE 5000 + ABS(CHECKSUM(NEWID())) % 95000                    -- 3% tienen 5k-100k
    END;

    -- Usar solo las primeras 40 categorias (las reales de streaming)
    DECLARE @catID INT = (ABS(CHECKSUM(NEWID())) % 40) + 1;

    INSERT INTO Streams (CanalID, CategoriaID, Titulo, FechaInicio, FechaFin, EspectadoresMax, DuracionMin)
    VALUES (
        (ABS(CHECKSUM(NEWID())) % 10000) + 1,
        @catID,
        CONCAT(@tituloBase, ' | Dia ', ABS(CHECKSUM(NEWID())) % 365 + 1),
        @inicioStream,
        DATEADD(MINUTE, @duracion, @inicioStream),
        @espectadores,
        @duracion
    );
    SET @m = @m + 1;
END;
GO
PRINT '>>> 10,000 Streams insertados con datos realistas';
GO

-- ============================================================
-- PASO 3e: INSERTAR 10,000 DONACIONES REALISTAS
-- ============================================================
DECLARE @n INT = 1;

DECLARE @mensajes TABLE (ID INT IDENTITY(1,1), Mensaje VARCHAR(200));
INSERT INTO @mensajes VALUES
('Sigue asi crack, eres el mejor!'),
('Para que te compres una pizza en el stream'),
('Tremendo gameplay, te mereces esto y mas'),
('Saludos desde Mexico! Vamos con todo'),
('Mi streamer favorito, nunca cambies'),
('Llevo 2 anos viendote, gracias por tanto'),
('Para el fondo de setup nuevo'),
('Este stream esta increible, toma mi dinero'),
('Primer donacion! Espero que sigas creciendo'),
('Feliz cumpleanos! Pasa un gran dia'),
('Esa jugada merecia una donacion'),
('Te descubri ayer y ya eres mi favorito'),
('Apoyo desde Colombia, parcero!'),
('Para que hagas mas streams de este juego'),
('Gracia por la buena vibra de siempre'),
('GG WP, esa partida estuvo epica'),
('Saludame porfa! Gran fan desde siempre'),
('Toma para el cafe de la madrugada'),
('Increible comunidad la que has creado'),
('Donacion anonima... jk, saludame!'),
('Eres una inspiracion, sigue streameando'),
('Para que llegues a tu meta de subs'),
('El mejor contenido de habla hispana'),
('Regalame una cancion y te dono el doble'),
('Primera vez en el stream, me encanta'),
('Veterano del canal desde el dia 1'),
('Te mereces mas viewers, eres genial'),
('Felicidades por el logro de hoy!'),
('Apoyo mensual, nos vemos el proximo mes'),
('Haz un stream de 24 horas y dono mas');

WHILE @n <= 10000
BEGIN
    DECLARE @mensajeID INT = (ABS(CHECKSUM(NEWID())) % 30) + 1;
    DECLARE @msg VARCHAR(200);
    SELECT @msg = Mensaje FROM @mensajes WHERE ID = @mensajeID;

    -- Montos con distribucion realista (muchas donaciones pequenas, pocas grandes)
    DECLARE @monto DECIMAL(10,2);
    DECLARE @tierMonto INT = ABS(CHECKSUM(NEWID())) % 100;
    SET @monto = CASE
        WHEN @tierMonto < 40 THEN CAST(1 + ABS(CHECKSUM(NEWID())) % 9 AS DECIMAL(10,2))            -- 40%: $1-$10
        WHEN @tierMonto < 70 THEN CAST(10 + ABS(CHECKSUM(NEWID())) % 40 AS DECIMAL(10,2))           -- 30%: $10-$50
        WHEN @tierMonto < 90 THEN CAST(50 + ABS(CHECKSUM(NEWID())) % 50 AS DECIMAL(10,2))           -- 20%: $50-$100
        WHEN @tierMonto < 98 THEN CAST(100 + ABS(CHECKSUM(NEWID())) % 400 AS DECIMAL(10,2))         -- 8%: $100-$500
        ELSE CAST(500 + ABS(CHECKSUM(NEWID())) % 4500 AS DECIMAL(10,2))                              -- 2%: $500-$5000
    END;
    -- Agregar centavos realistas
    SET @monto = @monto + CAST(ABS(CHECKSUM(NEWID())) % 100 AS DECIMAL(10,2)) / 100;

    INSERT INTO Donaciones (StreamID, UsuarioID, Monto, Mensaje, FechaDonacion)
    VALUES (
        (ABS(CHECKSUM(NEWID())) % 10000) + 1,
        (ABS(CHECKSUM(NEWID())) % 10000) + 1,
        @monto,
        @msg,
        DATEADD(MINUTE, -ABS(CHECKSUM(NEWID())) % 525600, GETDATE())
    );
    SET @n = @n + 1;
END;
GO
PRINT '>>> 10,000 Donaciones insertadas con datos realistas';
GO

-- Limpiar tablas temporales
DROP TABLE #Nombres;
DROP TABLE #Apellidos;
DROP TABLE #Paises;
DROP TABLE #Dominios;
DROP TABLE #Prefijos;
DROP TABLE #Sufijos;
GO

-- ============================================================
-- VERIFICAR CONTEO DE REGISTROS
-- ============================================================
SELECT 'Usuarios' AS Tabla, COUNT(*) AS Total FROM Usuarios
UNION ALL SELECT 'Categorias', COUNT(*) FROM Categorias
UNION ALL SELECT 'Canales', COUNT(*) FROM Canales
UNION ALL SELECT 'Streams', COUNT(*) FROM Streams
UNION ALL SELECT 'Donaciones', COUNT(*) FROM Donaciones;
GO

-- Muestra de datos por tabla
PRINT '>>> Muestra de Usuarios:';
SELECT TOP 5 * FROM Usuarios ORDER BY NEWID();
PRINT '>>> Muestra de Categorias:';
SELECT TOP 5 * FROM Categorias WHERE CategoriaID <= 40 ORDER BY NEWID();
PRINT '>>> Muestra de Canales:';
SELECT TOP 5 * FROM Canales ORDER BY NEWID();
PRINT '>>> Muestra de Streams:';
SELECT TOP 5 * FROM Streams ORDER BY NEWID();
PRINT '>>> Muestra de Donaciones:';
SELECT TOP 5 * FROM Donaciones ORDER BY NEWID();
GO

-- ============================================================
-- PASO 4: CREAR ÍNDICES
-- ============================================================

-- 4a. Indice NO agrupado - Usuarios por Pais
CREATE NONCLUSTERED INDEX IX_Usuarios_Pais
ON Usuarios (Pais);
GO

-- 4b. Indice UNICO - Email
CREATE UNIQUE NONCLUSTERED INDEX IX_Usuarios_Email_Unico
ON Usuarios (Email);
GO

-- 4c. Indice UNICO - NombreUsuario
CREATE UNIQUE NONCLUSTERED INDEX IX_Usuarios_NombreUsuario_Unico
ON Usuarios (NombreUsuario);
GO

-- 4d. Indice COMPUESTO - Streams por Canal y Categoria (con INCLUDE)
CREATE NONCLUSTERED INDEX IX_Streams_Canal_Categoria
ON Streams (CanalID, CategoriaID)
INCLUDE (Titulo, EspectadoresMax);
GO

-- 4e. Indice COMPUESTO - Donaciones por Stream y Monto
CREATE NONCLUSTERED INDEX IX_Donaciones_Stream_Monto
ON Donaciones (StreamID, Monto DESC);
GO

-- 4f. Indice NO agrupado - Streams por FechaInicio
CREATE NONCLUSTERED INDEX IX_Streams_FechaInicio
ON Streams (FechaInicio DESC);
GO

PRINT '============================================';
PRINT '>>> TODOS LOS INDICES CREADOS EXITOSAMENTE';
PRINT '============================================';
GO

-- ============================================================
-- PASO 5: CONSULTAS DE PRUEBA
-- Ejecuta cada una por separado con:
-- Cmd+Shift+P > "MS SQL: Explain Query"
-- y toma captura de pantalla del plan de ejecucion
-- ============================================================

-- CONSULTA 1: Streams ultimos 30 dias (usa IX_Streams_FechaInicio)
SELECT StreamID, Titulo, FechaInicio, EspectadoresMax
FROM Streams
WHERE FechaInicio >= DATEADD(DAY, -30, GETDATE())
ORDER BY FechaInicio DESC;
GO

-- CONSULTA 2: Usuarios de Mexico (usa IX_Usuarios_Pais)
SELECT UsuarioID, NombreUsuario, Email
FROM Usuarios
WHERE Pais = 'Mexico';
GO

-- CONSULTA 3: Buscar usuario por email exacto (usa IX_Usuarios_Email_Unico)
SELECT UsuarioID, NombreUsuario, Email, Pais
FROM Usuarios
WHERE Email = 'santiago.garcia1@gmail.com';
GO

-- CONSULTA 4: Streams por canal y categoria (usa IX_Streams_Canal_Categoria)
SELECT StreamID, Titulo, EspectadoresMax
FROM Streams
WHERE CanalID = 150 AND CategoriaID = 2;
GO

-- CONSULTA 5: Top 10 donaciones de un stream (usa IX_Donaciones_Stream_Monto)
SELECT TOP 10 DonacionID, UsuarioID, Monto, Mensaje
FROM Donaciones
WHERE StreamID = 500
ORDER BY Monto DESC;
GO