-- MySQL dump 10.16  Distrib 10.1.48-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: db
-- ------------------------------------------------------
-- Server version	10.1.48-MariaDB-0+deb9u2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `BannedUsers`
--

DROP TABLE IF EXISTS `BannedUsers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `BannedUsers` (
  `user_id` tinyint(4) DEFAULT NULL,
  `banned_user_id` tinyint(4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `BannedUsers`
--

LOCK TABLES `BannedUsers` WRITE;
/*!40000 ALTER TABLE `BannedUsers` DISABLE KEYS */;
INSERT INTO `BannedUsers` VALUES (6,7),(7,6),(9,10),(10,9),(11,12),(12,11),(13,14),(13,15),(14,13),(15,13),(16,17),(17,16);
/*!40000 ALTER TABLE `BannedUsers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `EventLists`
--

DROP TABLE IF EXISTS `EventLists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `EventLists` (
  `event_id` tinyint(4) DEFAULT NULL,
  `round_id` tinyint(4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `EventLists`
--

LOCK TABLES `EventLists` WRITE;
/*!40000 ALTER TABLE `EventLists` DISABLE KEYS */;
INSERT INTO `EventLists` VALUES (21,43),(21,44);
/*!40000 ALTER TABLE `EventLists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Events`
--

DROP TABLE IF EXISTS `Events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Events` (
  `id` tinyint(4) DEFAULT NULL,
  `name` smallint(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Events`
--

LOCK TABLES `Events` WRITE;
/*!40000 ALTER TABLE `Events` DISABLE KEYS */;
INSERT INTO `Events` VALUES (21,2024);
/*!40000 ALTER TABLE `Events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ListBannedUsers`
--

DROP TABLE IF EXISTS `ListBannedUsers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ListBannedUsers` (
  `id` tinyint(4) DEFAULT NULL,
  `user_id` tinyint(4) DEFAULT NULL,
  `banned_user_id` tinyint(4) DEFAULT NULL,
  `list_id` tinyint(4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ListBannedUsers`
--

LOCK TABLES `ListBannedUsers` WRITE;
/*!40000 ALTER TABLE `ListBannedUsers` DISABLE KEYS */;
INSERT INTO `ListBannedUsers` VALUES (4,16,6,43),(5,16,14,44),(6,11,10,43),(7,11,17,44),(8,17,9,43),(9,17,10,44),(10,7,15,44),(11,7,11,43),(12,6,15,43),(13,6,11,44),(14,14,8,43),(15,14,9,44),(16,13,16,44),(17,10,7,44),(18,9,13,43),(19,8,17,43),(20,8,12,44),(21,15,7,43),(22,15,8,44),(23,9,6,44),(24,10,12,43),(25,12,16,43),(26,12,14,44),(27,13,14,43);
/*!40000 ALTER TABLE `ListBannedUsers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `SelectionRounds`
--

DROP TABLE IF EXISTS `SelectionRounds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `SelectionRounds` (
  `id` tinyint(4) DEFAULT NULL,
  `name` varchar(17) DEFAULT NULL,
  `created_at` varchar(0) DEFAULT NULL,
  `event_id` tinyint(4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SelectionRounds`
--

LOCK TABLES `SelectionRounds` WRITE;
/*!40000 ALTER TABLE `SelectionRounds` DISABLE KEYS */;
INSERT INTO `SelectionRounds` VALUES (43,'made gift 2024','',21),(44,'secret santa 2024','',21);
/*!40000 ALTER TABLE `SelectionRounds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `UserSelections`
--

DROP TABLE IF EXISTS `UserSelections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `UserSelections` (
  `user_id` tinyint(4) DEFAULT NULL,
  `given_user_id` tinyint(4) DEFAULT NULL,
  `round_id` tinyint(4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserSelections`
--

LOCK TABLES `UserSelections` WRITE;
/*!40000 ALTER TABLE `UserSelections` DISABLE KEYS */;
INSERT INTO `UserSelections` VALUES (6,16,43),(7,13,43),(8,14,43),(9,11,43),(10,17,43),(11,6,43),(12,7,43),(13,12,43),(14,10,43),(15,9,43),(16,8,43),(17,15,43),(6,17,44),(7,12,44),(8,10,44),(9,8,44),(10,11,44),(11,6,44),(12,13,44),(13,14,44),(14,7,44),(15,16,44),(16,15,44),(17,9,44);
/*!40000 ALTER TABLE `UserSelections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Users`
--

DROP TABLE IF EXISTS `Users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Users` (
  `id` tinyint(4) DEFAULT NULL,
  `username` varchar(7) DEFAULT NULL,
  `password` varchar(7) DEFAULT NULL,
  `banned_users` varchar(0) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Users`
--

LOCK TABLES `Users` WRITE;
/*!40000 ALTER TABLE `Users` DISABLE KEYS */;
INSERT INTO `Users` VALUES (6,'katie','santa1',''),(7,'michael','santa2',''),(8,'beth','santa3',''),(9,'sarah','santa4',''),(10,'manoj','santa5',''),(11,'angela','santa6',''),(12,'manny','santa7',''),(13,'jesse','santa8',''),(14,'josh','santa9',''),(15,'julie','santa10',''),(16,'adam','santa11',''),(17,'rachel','santa12','');
/*!40000 ALTER TABLE `Users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sqlite_sequence`
--

DROP TABLE IF EXISTS `sqlite_sequence`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sqlite_sequence` (
  `name` varchar(15) DEFAULT NULL,
  `seq` tinyint(4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sqlite_sequence`
--

LOCK TABLES `sqlite_sequence` WRITE;
/*!40000 ALTER TABLE `sqlite_sequence` DISABLE KEYS */;
INSERT INTO `sqlite_sequence` VALUES ('Users',17),('SelectionRounds',44),('Events',21),('ListBannedUsers',27);
/*!40000 ALTER TABLE `sqlite_sequence` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-04-30 16:42:43
