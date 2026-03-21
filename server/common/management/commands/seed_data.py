from django.core.management.base import BaseCommand
from common.models import Journal, Conference, Book, Patent, HeroImage, HeaderSection, SupportLogo, OurServiece
import re


class Command(BaseCommand):
    help = "Seed database with journals, conferences, books, and admin dashboard items"

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Starting to seed database..."))

        # Seed Journals
        self.seed_journals()
        
        # Seed Conferences
        self.seed_conferences()
        
        # Seed Books
        self.seed_books()
        
        # Seed Patents
        self.seed_patents()
        
        # Seed Admin Dashboard Items
        self.seed_admin_dashboard()
        
        self.stdout.write(self.style.SUCCESS("Database seeding completed!"))

    def parse_date(self, date_str):
        """Parse date string to YYYY-MM-DD format"""
        if not date_str:
            return None
        
        # Extract year from strings like "July, 2025" or "2025"
        year_match = re.search(r'(\d{4})', date_str)
        if year_match:
            year = year_match.group(1)
            # Try to extract month
            month_map = {
                'january': '01', 'february': '02', 'march': '03', 'april': '04',
                'may': '05', 'june': '06', 'july': '07', 'august': '08',
                'september': '09', 'october': '10', 'november': '11', 'december': '12'
            }
            date_lower = date_str.lower()
            for month_name, month_num in month_map.items():
                if month_name in date_lower:
                    return f"{year}-{month_num}"
            return year
        return date_str

    def extract_volume_issue(self, text):
        """Extract volume and issue from text"""
        volume = None
        issue = None
        
        # Look for patterns like "vol.15", "no.15", "vol.16"
        vol_match = re.search(r'vol\.?\s*(\d+)', text, re.IGNORECASE)
        if vol_match:
            volume = vol_match.group(1)
        
        no_match = re.search(r'no\.?\s*(\d+(?:[/-]\d+)?)', text, re.IGNORECASE)
        if no_match:
            issue = no_match.group(1)
        
        return volume, issue

    def seed_journals(self):
        self.stdout.write("Seeding Journals...")
        
        journals_data = [
            {
                "title": "Privacy-preserving 3D human skeleton reconstruction from ankle-level 2D LiDAR using deep learning",
                "authors": "Mohibullah, M., Suda, Y., Hironaka, Y., Miyawaki, T., Suzuki, R., Hasan, M., & Kobayashi, Y.",
                "publication_date": "2025",
                "journal_name": "Neurocomputing",
                "volume": None,
                "issue": None,
                "pages": "131862",
                "issn": None,
                "publisher": "Elsevier",
                "doi": "10.1016/j.neucom.2025.131862"
            },
            {
                "title": "Restoration of speech packet estimating residue of burg linear prediction",
                "authors": "Ohidujjaman, Hasan, M., Ahmmed, S., Huda, M. N., & Uddin, M. S.",
                "publication_date": "2025",
                "journal_name": "Results in Engineering",
                "volume": "28",
                "issue": None,
                "pages": "107368",
                "issn": None,
                "publisher": "Elsevier",
                "doi": "10.1016/j.rineng.2025.107368"
            },
            {
                "title": "Design of Ultra-Wideband (UWB) Microstrip Patch Antenna for Biomedical Telemetry Applications",
                "authors": "Uddin, S., Mohibullah, M., & Hasan, M.",
                "publication_date": "2025",
                "journal_name": "ICCK Transactions on Mobile and Wireless Intelligence",
                "volume": "1",
                "issue": "1",
                "pages": "11-18",
                "issn": None,
                "publisher": "ICCK",
                "doi": "10.62762/TMWI.2025.250467"
            },
            {
                "title": "Improving Gait Recognition through Occlusion Detection and Silhouette Sequence Reconstruction",
                "authors": "K. Hasan, M. Z. Uddin, A. Ray, M. Hasan, F. Alnajjar and M. A. R. Ahad",
                "publication_date": "2024",
                "journal_name": "IEEE Access",
                "volume": None,
                "issue": None,
                "pages": None,
                "issn": None,
                "publisher": "IEEE",
                "doi": "10.1109/ACCESS.2024.3482430"
            },
            {
                "title": "Ill-condition enhancement for BC speech using RMC method",
                "authors": "Ohidujjaman, Hasan, M., Zhang, S. et al.",
                "publication_date": "2024",
                "journal_name": "International Journal of Speech Technology",
                "volume": None,
                "issue": None,
                "pages": None,
                "issn": None,
                "publisher": "Springer",
                "doi": "10.1007/s10772-024-10159-9"
            },
            {
                "title": "Spectral analysis of bone-conducted speech using modified linear prediction",
                "authors": "Ohidujjaman, Hasan, M., Zhang, S. et al.",
                "publication_date": "2024",
                "journal_name": "International Journal of Speech Technology",
                "volume": None,
                "issue": None,
                "pages": None,
                "issn": None,
                "publisher": "Springer",
                "doi": "10.1007/s10772-024-10151-3"
            },
            {
                "title": "PerFication: A Person Identifying Technique by Evaluating Gait with 2D LiDAR Data",
                "authors": "Hasan, M.; Uddin, M.K.; Suzuki, R.; Kuno, Y.; Kobayashi, Y.",
                "publication_date": "2024",
                "journal_name": "Electronics",
                "volume": "13",
                "issue": None,
                "pages": "3137",
                "issn": None,
                "publisher": "MDPI",
                "doi": "10.3390/electronics13163137"
            },
            {
                "title": "Audio Watermarking: A Comprehensive Review",
                "authors": "Mohammad Shorif Uddin, Ohidujjaman, Mahmudul Hasan and Tetsuya Shimamura",
                "publication_date": "2024",
                "journal_name": "International Journal of Advanced Computer Science and Applications (IJACSA)",
                "volume": "15",
                "issue": "5",
                "pages": None,
                "issn": None,
                "publisher": "The Science and Information Organization",
                "doi": "10.14569/IJACSA.2024.01505141"
            },
            {
                "title": "Unsupervised person Re-identification: A review of recent works",
                "authors": "M. Jahan, M. Hassan, S. Hossin, M. I. Hossain, and M. Hasan",
                "publication_date": "2023",
                "journal_name": "Neurocomputing",
                "volume": "572",
                "issue": None,
                "pages": "127193",
                "issn": None,
                "publisher": "Elsevier",
                "doi": "10.1016/j.neucom.2023.127193"
            },
            {
                "title": "Person Re-Identification with RGB–D and RGB–IR Sensors: A Comprehensive Survey",
                "authors": "Uddin MK, Bhuiyan A, Bappee FK, Islam MM, Hasan M",
                "publication_date": "2023",
                "journal_name": "Sensors",
                "volume": "23",
                "issue": "3",
                "pages": "1504",
                "issn": None,
                "publisher": "MDPI",
                "doi": "10.3390/s23031504"
            },
            {
                "title": "LiDAR-based Detection, Tracking, and Property Estimation: A Contemporary Review",
                "authors": "Hasan, M., Hanawa, J., Goto, R., Suzuki, R., Fukuda, H., Kuno, Y., Kobayashi, Y.",
                "publication_date": "2022",
                "journal_name": "Neurocomputing",
                "volume": None,
                "issue": None,
                "pages": None,
                "issn": None,
                "publisher": "Elsevier",
                "doi": "10.1016/j.neucom.2022.07.087"
            },
            {
                "title": "A Brief Analysis of Conversion Process of Bengali Case Structure (Dirukto Shobdo) for Universal Networking Language",
                "authors": "Md. Afzalur Rahaman and Mahmudul Hasan",
                "publication_date": "2022-01",
                "journal_name": "International Journal of Computer Applications",
                "volume": "183",
                "issue": "48",
                "pages": "20-26",
                "issn": None,
                "publisher": "Foundation of Computer Science",
                "doi": "10.5120/ijca2022921885"
            },
            {
                "title": "Fusion in Dissimilarity Space Between RGB-D and Skeleton for Person Re-Identification",
                "authors": "Md Kamal Uddin, Amran Bhuiyan, & Mahmudul Hasan",
                "publication_date": "2021",
                "journal_name": "International Journal of Innovative Technology and Exploring Engineering (IJITEE)",
                "volume": "10",
                "issue": "12",
                "pages": "69-75",
                "issn": None,
                "publisher": "Blue Eyes Intelligence Engineering & Sciences Publication",
                "doi": "10.35940/ijitee.L9566.10101221"
            },
            {
                "title": "A robust fuzzy approach for gene expression data clustering",
                "authors": "Jahan, M., Hasan, M.",
                "publication_date": "2021",
                "journal_name": "Soft Computing",
                "volume": None,
                "issue": None,
                "pages": None,
                "issn": None,
                "publisher": "Springer Nature",
                "doi": "10.1007/s00500-021-06397-7"
            },
            {
                "title": "Impact of Kernel-PCA on Different Features for Person Re-Identification",
                "authors": "Md Kamal Uddin, Amran Bhuiyan, & Mahmudul Hasan",
                "publication_date": "2021",
                "journal_name": "International Journal of Innovative Technology and Exploring Engineering (IJITEE)",
                "volume": "10",
                "issue": "11",
                "pages": "76-81",
                "issn": None,
                "publisher": "Blue Eyes Intelligence Engineering & Sciences Publication",
                "doi": "10.35940/ijitee.K9457.09101121"
            },
            {
                "title": "Person Tracking Using Ankle-Level LiDAR Based on Enhanced DBSCAN and OPTICS",
                "authors": "Hasan, M., Hanawa, J., Goto, R., Fukuda, H., Kuno, Y. and Kobayashi, Y.",
                "publication_date": "2021",
                "journal_name": "IEEJ Transactions on Electrical and Electronic Engineering",
                "volume": "16",
                "issue": None,
                "pages": "778-786",
                "issn": None,
                "publisher": "Wiley",
                "doi": "10.1002/tee.23358"
            },
            {
                "title": "A Novel Fuzzy Clustering Approach for Gene Classification",
                "authors": "Meskat Jahan and Mahmudul Hasan",
                "publication_date": "2020",
                "journal_name": "International Journal of Advanced Computer Science and Applications (IJACSA)",
                "volume": "11",
                "issue": "8",
                "pages": None,
                "issn": None,
                "publisher": "The Science and Information Organization",
                "doi": "10.14569/IJACSA.2020.0110809"
            },
            {
                "title": "Automatic Detection and Analysis of Melanoma Skin Cancer using Dermoscopy Images",
                "authors": "Mahmudul Hasan, Mohammad Mohsin, Md. Kamal Hossain Chowdhury",
                "publication_date": "2019-09",
                "journal_name": "International Journal of Recent Technology and Engineering (IJRTE)",
                "volume": "8",
                "issue": "3",
                "pages": None,
                "issn": "2277-3878",
                "publisher": "Blue Eyes Intelligence Engineering & Sciences Publication",
                "doi": "10.35940/ijrte.C4561.098319"
            },
            {
                "title": "A FAIR Resource Recommender System for Smart Open Scientific Inquiries",
                "authors": "Syed N. Sakib, Sajratul Y. Rubaiat, Kallol Naha, Hasan H. Rahman and Hasan M. Jamil",
                "publication_date": "2025-07",
                "journal_name": "Applied Sciences",
                "volume": "15",
                "issue": None,
                "pages": "1-34",
                "issn": "2076-3417",
                "publisher": "MDPI",
                "doi": None
            },
            {
                "title": "Geo-RDF Framework for Representing the Spatial Information of Bangladesh",
                "authors": "Hasan H. Rahman and H. Seddiqui",
                "publication_date": "2025-10",
                "journal_name": "International Journal of Web & Semantic Technology (IJWesT)",
                "volume": "16",
                "issue": "3/4",
                "pages": "1-17",
                "issn": "0976-2280",
                "publisher": "AIRCC",
                "doi": None
            },
            {
                "title": "Implementing a Declarative Query Language for High Level Machine Learning Application Design",
                "authors": "Hasan H. Rahman and Hasan M. Jamil",
                "publication_date": "2025-11",
                "journal_name": "Information Systems",
                "volume": "135",
                "issue": None,
                "pages": "1-30",
                "issn": "0306-4379",
                "publisher": "Elsevier (ScienceDirect)",
                "doi": None
            },
            {
                "title": "TopicMap-BN: Scalable and Explainable Framework for Cross-Source Bangla News Recommendation with BanglaBERT and BERTopic",
                "authors": "Hasan H. Rahman and Sumaia Afrin Sunny",
                "publication_date": "2025-10",
                "journal_name": "International Journal of Computer Science, Engineering and Applications (IJCSEA)",
                "volume": "15",
                "issue": "3/4/5",
                "pages": "1-19",
                "issn": "2231-0088",
                "publisher": "AIRCC",
                "doi": None
            },
            {
                "title": "EduBD: A Machine Understandable Approach to Integrate Information of Educational Institutions of Bangladesh",
                "authors": "S. Chakraborty, Hasan H. Rahman, H. Seddiqui and S. C. Debnath",
                "publication_date": "2016-01",
                "journal_name": "International Journal of Web & Semantic Technology (IJWesT)",
                "volume": "7",
                "issue": "1",
                "pages": "1-15",
                "issn": "0976-2280",
                "publisher": "AIRCC",
                "doi": None
            },
            {
                "title": "Mediator Based Architecture to Address Data Heterogeneity",
                "authors": "R. Mustafa and Hasan H. Rahman",
                "publication_date": "2013-07",
                "journal_name": "Daffodil International University Journal of Science and Technology",
                "volume": "8",
                "issue": "2",
                "pages": "1-4",
                "issn": None,
                "publisher": "Daffodil International University",
                "doi": None
            }
        ]

        for journal_data in journals_data:
            journal, created = Journal.objects.get_or_create(
                title=journal_data["title"],
                defaults=journal_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created journal: {journal.title}"))
            else:
                self.stdout.write(self.style.WARNING(f"Journal already exists: {journal.title}"))

    def seed_conferences(self):
        self.stdout.write("Seeding Conferences...")
        
        conferences_data = [
            {
                "title": "Potency of Latent Spaces in Inverse Quantum Dye Design",
                "authors": "Hasan H. Rahman, Lawrence Spear, Jonathan Flores, Hasan M. Jamil and Lan Li",
                "publication_date": "2025-06",
                "conference_name": "International Conference on Scalable Scientific Data Management (SSDBM)",
                "venue": "Columbus, USA",
                "isbn": "9798400714627",
                "pages": None,
                "publisher": "Association for Computing Machinery (ACM), New York, NY, United States",
                "doi": "10.1145/3733723"
            },
            {
                "title": "Toward Knowledge Engineering Using MatFlow for Inverse Quantum Dye Design",
                "authors": "Hasan H. Rahman and Hasan M. Jamil",
                "publication_date": "2024-03",
                "conference_name": "International Conference on High Performance Computing & Communications, Data Science & Systems, Smart City & Dependability in Sensor, Cloud & Big Data Systems & Application",
                "venue": "Melbourne, Australia",
                "isbn": "979-8-3503-3002-1",
                "pages": None,
                "publisher": "Institute of Electrical and Electronics Engineers (IEEE)",
                "doi": "https://doi.org/10.1109/HPCC-DSS-SmartCity-DependSys60770.2023.00124"
            },
            {
                "title": "Distinguish a Person by Face and Iris using fusion approach",
                "authors": "M.Z. Rahman, Hasan H. Rahman, M. R. R. Majumder",
                "publication_date": "2019-12",
                "conference_name": "2019 International Conference on Sustainable Technologies for Industry 4.0 (STI)",
                "venue": "Dhaka, Bangladesh",
                "isbn": "978-1-7281-6097-9",
                "pages": None,
                "publisher": "Institute of Electrical and Electronics Engineers (IEEE)",
                "doi": "https://doi.org/10.1109/STI47673.2019.9068042"
            },
            {
                "title": "Information Extraction from WWW using Structural Approach",
                "authors": "M.Z. Rahman, Hasan H. Rahman and M. F. B. A. Aziz",
                "publication_date": "2019-12",
                "conference_name": "2019 International Conference on Sustainable Technologies for Industry 4.0 (STI)",
                "venue": "Dhaka, Bangladesh",
                "isbn": "978-1-7281-6097-9",
                "pages": None,
                "publisher": "Institute of Electrical and Electronics Engineers (IEEE)",
                "doi": "https://doi.org/10.1109/STI47673.2019.9068080"
            },
            {
                "title": "Survey on Text-Based Sentiment Analysis of Bengali Language",
                "authors": "N. Banik, Hasan H. Rahman, S. Chakraborty, Muhammad Anwarul Azim and H. Seddiqui",
                "publication_date": "2019-05",
                "conference_name": "International Conference on Advances in Science, Engineering and Robotics Technology (ICASERT)",
                "venue": "Dhaka, Bangladesh",
                "isbn": "978-1-7281-3446-8",
                "pages": None,
                "publisher": "Institute of Electrical and Electronics Engineers (IEEE)",
                "doi": "https://doi.org/10.1109/ICASERT.2019.8934481"
            },
            {
                "title": "Toxicity Detection on Bengali Social Media Comments using Supervised Models",
                "authors": "Nayan Banik and Hasan H. Rahman",
                "publication_date": "2019-12",
                "conference_name": "2019 2nd International Conference on Innovation in Engineering and Technology (ICIET)",
                "venue": "Dhaka, Bangladesh",
                "isbn": "978-1-7281-6309-3",
                "pages": None,
                "publisher": "Institute of Electrical and Electronics Engineers (IEEE)",
                "doi": "https://doi.org/10.1109/ICIET48527.2019.9290710"
            },
            {
                "title": "Evaluation of Naive Bayes and Support Vector Machines on Bangla Textual Movie Reviews",
                "authors": "N. Banik and Hasan H. Rahman",
                "publication_date": "2018-09",
                "conference_name": "2018 International Conference on Bangla Speech and Language Processing (ICBSLP)",
                "venue": "Sylhet, Bangladesh",
                "isbn": "978-1-5386-8208-1",
                "pages": None,
                "publisher": "Institute of Electrical and Electronics Engineers (IEEE)",
                "doi": "https://doi.org/10.1109/ICBSLP.2018.8554497"
            },
            {
                "title": "GRU based Named Entity Recognition System for Bangla Online Newspapers",
                "authors": "N. Banik and Hasan H. Rahman",
                "publication_date": "2018-12",
                "conference_name": "2018 International Conference on Innovation in Engineering and Technology (ICIET)",
                "venue": "Dhaka, Bangladesh",
                "isbn": "978-1-5386-5230-5",
                "pages": None,
                "publisher": "Institute of Electrical and Electronics Engineers (IEEE)",
                "doi": "https://doi.org/10.1109/CIET.2018.8660795"
            },
            {
                "title": "Semantic Annotation of Bangla News Stream to Record History",
                "authors": "Md. Nesarul Hoque, Md. Hanif Seddiqui and Hasan H. Rahman",
                "publication_date": "2015-12",
                "conference_name": "2015 18th International Conference on Computer and Information Technology (ICCIT)",
                "venue": "Dhaka, Bangladesh",
                "isbn": "978-1-4673-9930-2",
                "pages": None,
                "publisher": "Institute of Electrical and Electronics Engineers (IEEE)",
                "doi": "https://doi.org/10.1109/ICCITechn.2015.7488135"
            },
            {
                "title": "Linked Open Data Representation of Historical Heritage of Bangladesh",
                "authors": "S. Chakraborty, Hasan H. Rahman and Md. Hanif Seddiqui",
                "publication_date": "2014-03",
                "conference_name": "16th Int'l Conf. Computer and Information Technology",
                "venue": "Khulna, Bangladesh",
                "isbn": "978-1-4799-3497-3",
                "pages": None,
                "publisher": "Institute of Electrical and Electronics Engineers (IEEE)",
                "doi": "https://doi.org/10.1109/ICCITechn.2014.6997363"
            },
            {
                "title": "Machine Understandable Information Representation of Geographic Related Data to the Administrative Structure of Bangladesh",
                "authors": "Hasan H. Rahman, S. Chakraborty and Md. Hanif Seddiqui",
                "publication_date": "2014-03",
                "conference_name": "16th Int'l Conf. Computer and Information Technology",
                "venue": "Khulna, Bangladesh",
                "isbn": "978-1-4799-3497-3",
                "pages": None,
                "publisher": "Institute of Electrical and Electronics Engineers (IEEE)",
                "doi": "https://doi.org/10.1109/ICCITechn.2014.6997359"
            },
            {
                "title": "Semantic information integration of Health Care Network for Physical-Cyber-Social computing approach",
                "authors": "Hasan H. Rahman, S. Chakraborty and Md. Hanif Seddiqui",
                "publication_date": "2014-12",
                "conference_name": "2014 17th International Conference on Computer and Information Technology (ICCIT)",
                "venue": "Dhaka, Bangladesh",
                "isbn": "978-1-4799-6288-4",
                "pages": None,
                "publisher": "Institute of Electrical and Electronics Engineers (IEEE)",
                "doi": None
            },
            {
                "title": "Affordable Smart Vending Machine with Deep Learning-Based Real-Time Bangladeshi Currency Recognition",
                "authors": "H. M. Insaf, M. A. Rahman, M. Z. Rahman, Ohidujjaman and M. Hasan",
                "publication_date": "2025",
                "conference_name": "2025 International Conference on Quantum Photonics, Artificial Intelligence, and Networking (QPAIN)",
                "venue": "Rangpur, Bangladesh",
                "isbn": None,
                "pages": "1-6",
                "publisher": "IEEE",
                "doi": "10.1109/QPAIN66474.2025.11171680"
            },
            {
                "title": "A Facial Gesture-Controlled Wheelchair for Individuals with Complete Disabilities",
                "authors": "K. J. Ritu, S. S. Mahmud, S. Bhuiyan, Ohidujjaman and M. Hasan",
                "publication_date": "2025",
                "conference_name": "2025 2nd International Conference on Next-Generation Computing, IoT and Machine Learning (NCIM)",
                "venue": "Gazipur, Bangladesh",
                "isbn": None,
                "pages": "1-6",
                "publisher": "IEEE",
                "doi": "10.1109/NCIM65934.2025.11159844"
            },
            {
                "title": "Flow-Label Trends in IPv6 Traffic: A 9-Year Analysis of a Dataset Collected in Japan",
                "authors": "Khan, Al Nafeu, Mahmudul Hasan, Safiqul Islam, Khondaker Salehin, Michael Welzl, Boning Feng, and Eiji Oki",
                "publication_date": "2025",
                "conference_name": "2025 IEEE 26th International Conference on High Performance Switching and Routing (HPSR)",
                "venue": "",
                "isbn": None,
                "pages": "1-6",
                "publisher": "IEEE",
                "doi": "10.1109/HPSR64165.2025.11038848"
            },
            {
                "title": "Revolutionizing Fire Safety: Real-Time Fire Detection in Buildings Using YOLOv8",
                "authors": "Mahmud, Syed Shakil; Ritu, Khandaker Jannatul; Bhuiyan, Shakirul; Khatun, Mahmuda; Ohidujjaman; Hassan, Mahmudul",
                "publication_date": "2025-02",
                "conference_name": "Undergraduate Conference on Intelligent Computing and Systems (UCICS 2025)",
                "venue": "Varendra University, Rajshahi, Bangladesh",
                "isbn": None,
                "pages": "74-77",
                "publisher": "",
                "doi": None
            },
            {
                "title": "RTSLIS: A Real-Time Sign Language Interpretation System Based on Vision Transformers",
                "authors": "M. T. M. Himel, M. Jahan, A. Tamjeed and M. Hasan",
                "publication_date": "2024",
                "conference_name": "2024 27th International Conference on Computer and Information Technology (ICCIT)",
                "venue": "Cox's Bazar, Bangladesh",
                "isbn": None,
                "pages": "1075-1080",
                "publisher": "IEEE",
                "doi": "10.1109/ICCIT64611.2024.11021808"
            },
            {
                "title": "SelfBOT: An Automated Wheel-Chair Control Using Facial Gestures Only",
                "authors": "K. J. Ritu, K. Ahammad, M. Mohibullah, M. Khatun, M. Z. Uddin, M. K. Uddin, Y. Kobayashi and M. Hasan",
                "publication_date": "2023-12",
                "conference_name": "2023 26th International Conference on Computer and Information Technology (ICCIT)",
                "venue": "Cox's Bazar, Bangladesh",
                "isbn": None,
                "pages": None,
                "publisher": "IEEE",
                "doi": "10.1109/ICCIT60459.2023.10441531"
            },
            {
                "title": "Multimodal Emotion Recognition through Deep Fusion of Audio-Visual Data",
                "authors": "T. Sultana, M. Jahan, M. K. Uddin, Y. Kobayashi and M. Hasan",
                "publication_date": "2023-12",
                "conference_name": "2023 26th International Conference on Computer and Information Technology (ICCIT)",
                "venue": "Cox's Bazar, Bangladesh",
                "isbn": None,
                "pages": None,
                "publisher": "IEEE",
                "doi": "10.1109/ICCIT60459.2023.10441424"
            },
            {
                "title": "Cross-Modal Person Re-identification for Service Robot",
                "authors": "M. K. Uddin, R. Kuri, F. Shamim, M. R. U. Islam, M. Z. Uddin and M. Hasan",
                "publication_date": "2023-12",
                "conference_name": "2023 26th International Conference on Computer and Information Technology (ICCIT)",
                "venue": "Cox's Bazar, Bangladesh",
                "isbn": None,
                "pages": None,
                "publisher": "IEEE",
                "doi": "10.1109/ICCIT60459.2023.10441474"
            },
            {
                "title": "Safety Helmet Detection of Workers in Construction Site using YOLOv8",
                "authors": "S. S. Mahmud, M. A. Islam, K. J. Ritu, M. Hasan, Y. Kobayashi and M. Mohibullah",
                "publication_date": "2023-12",
                "conference_name": "2023 26th International Conference on Computer and Information Technology (ICCIT)",
                "venue": "Cox's Bazar, Bangladesh",
                "isbn": None,
                "pages": None,
                "publisher": "IEEE",
                "doi": "10.1109/ICCIT60459.2023.10441212"
            },
            {
                "title": "Bengali Text generation Using Bi-directional RNN",
                "authors": "S. Abujar, A. K. M. Masum, S. M. M. H. Chowdhury, M. Hasan, and S. A. Hossain",
                "publication_date": "2019",
                "conference_name": "2019 10th International Conference on Computing, Communication and Networking Technologies (ICCCNT)",
                "venue": "Kanpur, India",
                "isbn": None,
                "pages": "1-5",
                "publisher": "IEEE",
                "doi": None
            },
            {
                "title": "Performance Analysis and Benchmarking of Clustering Algorithms with gene datasets",
                "authors": "Meskat Jahan, Mahmudul Hasan",
                "publication_date": "2019-05",
                "conference_name": "IEEE International Conference on Advances in Science, Engineering and Robotics Technology (ICASERT 2019)",
                "venue": "East West University, Dhaka, Bangladesh",
                "isbn": None,
                "pages": None,
                "publisher": "IEEE",
                "doi": None
            },
            {
                "title": "Representation of Bengali into UNL: An Analysis of Appropriate Bengali Verbs",
                "authors": "Mozammel Haque, Mahmudul Hasan",
                "publication_date": "2018-12",
                "conference_name": "IEEE - International Conference on Innovation in Engineering and Technology 2018",
                "venue": "University of Dhaka, Bangladesh",
                "isbn": None,
                "pages": None,
                "publisher": "IEEE",
                "doi": None
            },
            {
                "title": "English to Bengali Machine Translation: An Analysis of Semantically Appropriate Verbs",
                "authors": "Mozammel Haque, Mahmudul Hasan",
                "publication_date": "2018-10",
                "conference_name": "IEEE - International Conference on Innovation in Science Engineering and Technology(ICISET)",
                "venue": "IIUC Bangladesh",
                "isbn": None,
                "pages": None,
                "publisher": "IEEE",
                "doi": None
            },
            {
                "title": "A Heuristic Approach of Text Summarization for Bengali Documentation",
                "authors": "Sheikh Abujar, Mahmudul Hasan, M.S.I Shahin, Sayed Akter Hossain",
                "publication_date": "2017-07",
                "conference_name": "8th IEEE ICCCNT 2017",
                "venue": "IIT Delhi, Delhi, India",
                "isbn": None,
                "pages": None,
                "publisher": "IEEE",
                "doi": None
            },
            {
                "title": "A Comprehensive Text Analysis for Bengali TTS using Unicode",
                "authors": "Sheikh Abujar, Mahmudul Hasan",
                "publication_date": "2016-05",
                "conference_name": "5th IEEE International Conference on Informatics, Electronics, and Vision (ICIEV)",
                "venue": "Dhaka, Bangladesh",
                "isbn": None,
                "pages": None,
                "publisher": "IEEE",
                "doi": None
            },
            {
                "title": "An Empirical Study on constructing the Bangla Dirukto Shobdo for Universal Networking Language (UNL)",
                "authors": "Mahmudul Hasan, Md. Afzalur Rahman, Narayan Ranjan Chakraborty",
                "publication_date": "2015-12",
                "conference_name": "18th IEEE-ICCIT – 2015",
                "venue": "Dhaka, Bangladesh",
                "isbn": None,
                "pages": "227-230",
                "publisher": "IEEE",
                "doi": None
            },
            {
                "title": "Enhancement of Speech Signal by Originating Computational Iteration using SAF",
                "authors": "Mahmudul Hasan, Ohidujjaman, Mohammad Nurul Huda",
                "publication_date": "2014-12",
                "conference_name": "14th IEEE – ISSPIT 2014",
                "venue": "JIIT, Noida, India",
                "isbn": None,
                "pages": None,
                "publisher": "IEEE",
                "doi": None
            },
            {
                "title": "Transformation of Bangla to English Sentences for Proficient Net-Searching",
                "authors": "Depok Chakma, Md. Sazzadur Ahmed, Mahmudul Hasan",
                "publication_date": "2016-05",
                "conference_name": "5th IEEE International Conference on Informatics, Electronics and Vision (ICIEV-SIEV)",
                "venue": "Dhaka, Bangladesh",
                "isbn": None,
                "pages": None,
                "publisher": "IEEE",
                "doi": None
            },
            {
                "title": "A Parametric Formulation to Detect Speech Activity of Noisy Speech using EDON",
                "authors": "Mahmudul Hasan, Md. Ekramul Hamid",
                "publication_date": "2010-12",
                "conference_name": "ICCIT, IEEE",
                "venue": "Dhaka, Bangladesh",
                "isbn": None,
                "pages": "63",
                "publisher": "IEEE",
                "doi": None
            },
            {
                "title": "Block Semi-Random Interleave Design for Turbo Codes",
                "authors": "Mahmudul Hasan, Md. Iqbal Aziz Khan, Sujan Kumar Roy, K. M. Ibrahim Khalilullah",
                "publication_date": "2008-06",
                "conference_name": "ICECC",
                "venue": "Bangladesh",
                "isbn": "984-300-002131-3",
                "pages": "48-49",
                "publisher": "",
                "doi": None
            },
            {
                "title": "Single Channel Noise Reduction using Adaptive Filter and Comparative study with respect to Linear Filter",
                "authors": "Md. Zahangir Alom, Md. Zahangir Alam, Sujon Kumar Roy, Mahmudul Hasan, Chowdhury Sajadul Islam",
                "publication_date": "2008-06",
                "conference_name": "ICECC",
                "venue": "Bangladesh",
                "isbn": "984-300-002131-3",
                "pages": "34",
                "publisher": "",
                "doi": None
            },
            {
                "title": "Design and Implementation of an Efficient Search Engine with Bangla Interface using NLP",
                "authors": "Sujan Kumar Roy, K.M Ibrahim Khalilullah, Md. Iqbal Aziz Khan, Mahmudul Hasan",
                "publication_date": "2008-06",
                "conference_name": "ICECC",
                "venue": "Bangladesh",
                "isbn": "984-300-002131-3",
                "pages": "49",
                "publisher": "",
                "doi": None
            },
            {
                "title": "Algorithm for fast recovery from link failure and acknowledgment in IP based Network",
                "authors": "Mahmudul Hasan, Md. Iqbal Aziz Khan",
                "publication_date": "2007-06",
                "conference_name": "NCEIT",
                "venue": "Rajshahi, Bangladesh",
                "isbn": "984-300-000645-7",
                "pages": "205-206",
                "publisher": "",
                "doi": None
            }
        ]

        for conf_data in conferences_data:
            # Ensure pages has a value if None
            if conf_data.get("pages") is None:
                conf_data["pages"] = ""
            # Ensure venue has a value if None
            if conf_data.get("venue") is None:
                conf_data["venue"] = ""
            # Ensure publisher has a value if None
            if conf_data.get("publisher") is None:
                conf_data["publisher"] = ""
            
            conference, created = Conference.objects.get_or_create(
                title=conf_data["title"],
                defaults=conf_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created conference: {conference.title}"))
            else:
                self.stdout.write(self.style.WARNING(f"Conference already exists: {conference.title}"))

    def seed_books(self):
        self.stdout.write("Seeding Books...")
        
        books_data = [
            {
                "title": "Estimation of Noise Parameter and Detection of Speech Activity using Degree of Noise",
                "authors": "Mahmudul Hasan",
                "publication_date": "2011-12",
                "pages": None,
                "isbn": "978-3-8465-1823-6",
                "publisher": "LAP LAMBERT Academic Publishing GmbH & Co."
            },
            # Book Chapters - storing as books
            {
                "title": "Pedestrian Tracking Using Ankle-Level 2D-LiDAR Based on ByteTrack",
                "authors": "Mohibullah, M., Hironaka, Y., Suda, Y., Suzuki, R., Hasan, M., Kobayashi, Y.",
                "publication_date": "2025",
                "pages": None,
                "isbn": "978-3-031-77392-1",
                "publisher": "Springer, Cham (Lecture Notes in Computer Science, vol 15046)",
                "doi": "10.1007/978-3-031-77392-1_16"
            },
            {
                "title": "Person Property Estimation Based on 2D LiDAR Data Using Deep Neural Network",
                "authors": "Hasan M., Goto R., Hanawa J., Fukuda H., Kuno Y., Kobayashi Y.",
                "publication_date": "2021",
                "pages": None,
                "isbn": "978-3-030-84522-3",
                "publisher": "Springer, Cham (Lecture Notes in Computer Science, vol 12836)",
                "doi": "10.1007/978-3-030-84522-3_62"
            },
            {
                "title": "Tracking People Using Ankle-Level 2D LiDAR for Gait Analysis",
                "authors": "Hasan M., Hanawa J., Goto R., Fukuda H., Kuno Y., Kobayashi Y.",
                "publication_date": "2021",
                "pages": None,
                "isbn": "978-3-030-51328-3",
                "publisher": "Springer, Cham (Advances in Intelligent Systems and Computing, vol 1213)",
                "doi": "10.1007/978-3-030-51328-3_7"
            },
            {
                "title": "Sentence Similarity Estimation for Text Summarization Using Deep Learning",
                "authors": "Abujar S., Hasan M., Hossain S.A.",
                "publication_date": "2019",
                "pages": None,
                "isbn": "978-981-13-1610-4",
                "publisher": "Springer, Singapore (Advances in Intelligent Systems and Computing, vol 828)",
                "doi": "10.1007/978-981-13-1610-4_16"
            }
        ]

        for book_data in books_data:
            book, created = Book.objects.get_or_create(
                title=book_data["title"],
                defaults=book_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created book: {book.title}"))
            else:
                # Update existing book if DOI is missing but provided in seed data
                updated = False
                if book_data.get("doi") and not book.doi:
                    book.doi = book_data["doi"]
                    book.save()
                    updated = True
                if updated:
                    self.stdout.write(self.style.SUCCESS(f"Updated book with DOI: {book.title}"))
                else:
                    self.stdout.write(self.style.WARNING(f"Book already exists: {book.title}"))

    def seed_patents(self):
        self.stdout.write("Seeding Patents...")
        
        patents_data = [
            {
                "title": "System and Method for Machine Learning Model Training and Deployment",
                "inventors": "John Smith, Jane Doe, Robert Johnson",
                "publication_date": "2024-03-15",
                "patent_office": "U.S. Patent",
                "patent_number": "US 11,234,567 B2",
                "application_number": "16/789,123",
                "patent_link": "https://patents.google.com/patent/US11234567B2"
            },
            {
                "title": "Apparatus for Real-Time Data Processing Using Neural Networks",
                "inventors": "Michael Chen, Sarah Williams, David Brown",
                "publication_date": "2023-11-20",
                "patent_office": "U.S. Patent",
                "patent_number": "US 11,123,456 B2",
                "application_number": "17/456,789",
                "patent_link": "https://patents.google.com/patent/US11123456B2"
            },
            {
                "title": "Method for Automated Feature Selection in Machine Learning",
                "inventors": "Emily Davis, James Wilson, Lisa Anderson",
                "publication_date": "2023-08-10",
                "patent_office": "U.S. Patent",
                "patent_number": "US 11,012,345 B2",
                "application_number": "16/234,567",
                "patent_link": "https://patents.google.com/patent/US11012345B2"
            },
            {
                "title": "System for Distributed Computing in Cloud-Based Machine Learning",
                "inventors": "Christopher Lee, Amanda Taylor, Mark Martinez",
                "publication_date": "2022-12-05",
                "patent_office": "U.S. Patent",
                "patent_number": "US 10,987,654 B2",
                "application_number": "16/123,456",
                "patent_link": "https://patents.google.com/patent/US10987654B2"
            },
            {
                "title": "Apparatus and Method for Natural Language Processing Using Transformer Models",
                "inventors": "Daniel Kim, Rachel Green, Thomas White",
                "publication_date": "2022-06-18",
                "patent_office": "U.S. Patent",
                "patent_number": "US 10,876,543 B2",
                "application_number": "15/890,234",
                "patent_link": "https://patents.google.com/patent/US10876543B2"
            },
            {
                "title": "System for Computer Vision Using Deep Convolutional Neural Networks",
                "inventors": "Patricia Harris, Kevin Moore, Jennifer Clark",
                "publication_date": "2021-09-22",
                "patent_office": "U.S. Patent",
                "patent_number": "US 10,765,432 B2",
                "application_number": "15/678,901",
                "patent_link": "https://patents.google.com/patent/US10765432B2"
            },
            {
                "title": "Method for Optimizing Hyperparameters in Machine Learning Models",
                "inventors": "Steven Lewis, Michelle Young, Brian King",
                "publication_date": "2021-04-14",
                "patent_office": "U.S. Patent",
                "patent_number": "US 10,654,321 B2",
                "application_number": "15/567,890",
                "patent_link": "https://patents.google.com/patent/US10654321B2"
            },
            {
                "title": "Apparatus for Automated Data Preprocessing in Machine Learning Pipelines",
                "inventors": "Nicole Adams, Ryan Scott, Laura Rodriguez",
                "publication_date": "2020-10-30",
                "patent_office": "U.S. Patent",
                "patent_number": "US 10,543,210 B2",
                "application_number": "15/456,789",
                "patent_link": "https://patents.google.com/patent/US10543210B2"
            }
        ]

        for patent_data in patents_data:
            patent, created = Patent.objects.get_or_create(
                title=patent_data["title"],
                defaults=patent_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created patent: {patent.title}"))
            else:
                # Update existing patent if patent_link is missing but provided in seed data
                updated = False
                if patent_data.get("patent_link") and not patent.patent_link:
                    patent.patent_link = patent_data["patent_link"]
                    patent.save()
                    updated = True
                if updated:
                    self.stdout.write(self.style.SUCCESS(f"Updated patent with link: {patent.title}"))
                else:
                    self.stdout.write(self.style.WARNING(f"Patent already exists: {patent.title}"))

    def seed_admin_dashboard(self):
        self.stdout.write("Seeding Admin Dashboard items...")
        
        # Seed Header Section
        header_section, created = HeaderSection.objects.get_or_create(
            title="Workflow",
            defaults={
                "content": "Streamline your machine learning workflow with our intuitive platform. Design, execute, and manage complex ML pipelines with ease."
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS("Created header section"))
        else:
            self.stdout.write(self.style.WARNING("Header section already exists"))

        # Seed Services (OurServiece)
        services_data = [
            {
                "service_key": "matflow",
                "service_name": "MatFlow",
                "service_description": "Streamline your machine learning workflow with our intuitive platform. Design, execute, and manage complex ML pipelines with ease.",
                "service_url": "http://localhost:6060/matflow"
            },
          
        ]

        for service_data in services_data:
            service, created = OurServiece.objects.get_or_create(
                service_key=service_data["service_key"],
                service_name=service_data["service_name"],
                defaults=service_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created service: {service.service_name}"))
            else:
                updated = False
                if service.service_name != service_data["service_name"]:
                    service.service_name = service_data["service_name"]
                    updated = True
                if service.service_description != service_data["service_description"]:
                    service.service_description = service_data["service_description"]
                    updated = True
                if service.service_url != service_data["service_url"]:
                    service.service_url = service_data["service_url"]
                    updated = True

                if updated:
                    service.save()
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Updated service: {service.service_name} ({service.service_url})"
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f"Service already up to date: {service.service_name}"
                        )
                    )

        self.stdout.write(self.style.SUCCESS("Admin dashboard seeding completed!"))
        self.stdout.write(self.style.WARNING(
            "Note: Hero Images, Support Logos, and Service Logos need to be added manually through the admin dashboard as they require image files."
        ))

