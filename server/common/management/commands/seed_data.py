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
                "title": "A FAIR Resource Recommender System for Smart Open Scientific Inquiries",
                "authors": "Syed N. Sakib, Sajratul Y. Rubaiat, Kallol Naha, Hasan H. Rahman and Hasan M. Jamil",
                "publication_date": "2025-07",
                "journal_name": "Applied Sciences",
                "volume": "15",
                "issue": None,
                "pages": "1-34",
                "issn": "2076-3417",
                "publisher": "MDPI",
                "doi":  "https://doi.org/10.3390/app15158334"
            },

            {
                "title": "Implementing a Declarative Query Language for High Level Machine Learning Application Design",
                "authors": "Hasan H. Rahman and Hasan M. Jamil",
                "publication_date": "2026-04",
                "journal_name": "Information Systems",
                "volume": "137",
                "issue": None,
                "pages": "1-30",
                "issn": "0306-4379",
                "publisher": "Elsevier (ScienceDirect)",
                "doi": "https://doi.org/10.1016/j.is.2025.102637"
            },

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
                "title": "Dreaming Up Novel Quantum Dyes using Inverse Machine Learning in MatFlow",
                "authors": "Ornob, Mahib H and Li, Lan and Jamil, Hasan M",
                "publication_date": "2025-10-07",
                "conference_name": "2025 IEEE International Conference on eScience (eScience)",
                "venue": "Chicago, IL, USA",
                "isbn": "979-8-3315-9145-8",
                "pages": 20-29,
                "publisher": "Institute of Electrical and Electronics Engineers (IEEE)",
                "doi": "10.1109/eScience65000.2025.00012"
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

