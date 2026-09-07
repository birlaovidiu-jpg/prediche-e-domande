# -*- coding: utf-8 -*-
# id, italiano, romeno, testamento, capitoli, alias
LIBRI=[
(1,"Genesi","Geneza","AT",50,"genesi genesa geneza gen"),
(2,"Esodo","Exodul","AT",40,"esodo exod exodul es"),
(3,"Levitico","Leviticul","AT",27,"levitico leviticul leveticul leviticuo lev"),
(4,"Numeri","Numeri","AT",36,"numeri num"),
(5,"Deuteronomio","Deuteronomul","AT",34,"deuteronomio deuteronom deuteronomul deut"),
(6,"Giosuè","Iosua","AT",24,"giosue giosuè iosua ios"),
(7,"Giudici","Judecătorii","AT",21,"giudici judecatorii judecătorii jud"),
(8,"Rut","Rut","AT",4,"rut rute"),
(9,"1 Samuele","1 Samuel","AT",31,"1samuele 1samuel 1 samuele 1 samuel isamuele"),
(10,"2 Samuele","2 Samuel","AT",24,"2samuele 2samuel 2 samuele 2 samuel"),
(11,"1 Re","1 Regi","AT",22,"1re 1 re 1regi 1 regi 1°re 1 imparati 1 împărați"),
(12,"2 Re","2 Regi","AT",25,"2re 2 re 2regi 2 regi 2°re 2 imparati 2 împărați"),
(13,"1 Cronache","1 Cronici","AT",29,"1cronache 1 cronache 1cronici 1 cronici 1°cronache"),
(14,"2 Cronache","2 Cronici","AT",36,"2cronache 2 cronache 2cronici 2 cronici 2°cronache"),
(15,"Esdra","Ezra","AT",10,"esdra ezra esra"),
(16,"Neemia","Neemia","AT",13,"neemia nehemia"),
(17,"Ester","Estera","AT",10,"ester estera"),
(18,"Giobbe","Iov","AT",42,"giobbe iov"),
(19,"Salmi","Psalmii","AT",150,"salmi salmo psalmii psalmul psalm sal"),
(20,"Proverbi","Proverbele","AT",31,"proverbi proverbele proverbe prov"),
(21,"Ecclesiaste","Eclesiastul","AT",12,"ecclesiaste eclesiastul eclesiaste ecl"),
(22,"Cantico dei Cantici","Cântarea Cântărilor","AT",8,"cantico dei cantici cantico cantarea cantarilor cântarea cântărilor"),
(23,"Isaia","Isaia","AT",66,"isaia isa"),
(24,"Geremia","Ieremia","AT",52,"geremia ieremia ger"),
(25,"Lamentazioni","Plângerile lui Ieremia","AT",5,"lamentazioni plangerile plângerile lam"),
(26,"Ezechiele","Ezechiel","AT",48,"ezechiele ezechiel ezeciele eze"),
(27,"Daniele","Daniel","AT",12,"daniele daniel dan"),
(28,"Osea","Osea","AT",14,"osea"),
(29,"Gioele","Ioel","AT",3,"gioele gioiele ioel"),
(30,"Amos","Amos","AT",9,"amos"),
(31,"Abdia","Obadia","AT",1,"abdia obadia"),
(32,"Giona","Iona","AT",4,"giona iona"),
(33,"Michea","Mica","AT",7,"michea miche mica"),
(34,"Naum","Naum","AT",3,"naum"),
(35,"Abacuc","Habacuc","AT",3,"abacuc habacuc"),
(36,"Sofonia","Țefania","AT",3,"sofonia tefania țefania"),
(37,"Aggeo","Hagai","AT",2,"aggeo ageo hagai"),
(38,"Zaccaria","Zaharia","AT",14,"zaccaria zaharia"),
(39,"Malachia","Maleahi","AT",4,"malachia maleahi"),
(40,"Matteo","Matei","NT",28,"matteo matei mat"),
(41,"Marco","Marcu","NT",16,"marco marcu"),
(42,"Luca","Luca","NT",24,"luca"),
(43,"Giovanni","Ioan","NT",21,"giovanni ioan gio"),
(44,"Atti","Faptele Apostolilor","NT",28,"atti fapte faptele apostolilor"),
(45,"Romani","Romani","NT",16,"romani rom"),
(46,"1 Corinzi","1 Corinteni","NT",16,"1corinzi 1 corinzi 1corinteni 1 corinteni corinzi"),
(47,"2 Corinzi","2 Corinteni","NT",13,"2corinzi 2 corinzi 2corinteni 2 corinteni"),
(48,"Galati","Galateni","NT",6,"galati galateni"),
(49,"Efesini","Efeseni","NT",6,"efesini efeseni"),
(50,"Filippesi","Filipeni","NT",4,"filippesi filipeni"),
(51,"Colossesi","Coloseni","NT",4,"colossesi coloseni"),
(52,"1 Tessalonicesi","1 Tesaloniceni","NT",5,"1 tes 1tes 1 tessalonicesi tessalonicesi 1 tesaloniceni"),
(53,"2 Tessalonicesi","2 Tesaloniceni","NT",3,"2 tes 2tes 2 tessalonicesi 2 tesaloniceni"),
(54,"1 Timoteo","1 Timotei","NT",6,"1 timoteo 1timoteo timoteo 1 timotei"),
(55,"2 Timoteo","2 Timotei","NT",4,"2 timoteo 2timoteo 2 timotei"),
(56,"Tito","Tit","NT",3,"tito tit"),
(57,"Filemone","Filimon","NT",1,"filemone filimone filimon"),
(58,"Ebrei","Evrei","NT",13,"ebrei evrei"),
(59,"Giacomo","Iacov","NT",5,"giacomo iacov gia"),
(60,"1 Pietro","1 Petru","NT",5,"1 pietro 1pietro pietro 1 petru"),
(61,"2 Pietro","2 Petru","NT",3,"2 pietro 2pietro 2 petru"),
(62,"1 Giovanni","1 Ioan","NT",5,"1 giovanni 1giovanni 1 ioan"),
(63,"2 Giovanni","2 Ioan","NT",1,"2 giovanni 2giovanni 2 ioan"),
(64,"3 Giovanni","3 Ioan","NT",1,"3 giovanni 3giovanni 3 ioan"),
(65,"Giuda","Iuda","NT",1,"giuda iuda giu"),
(66,"Apocalisse","Apocalipsa","NT",22,"apocalisse apocalipsa apoc rivelazione"),
]
import re,unicodedata
def sk(s):
    s=unicodedata.normalize('NFD',s.lower())
    s=''.join(c for c in s if unicodedata.category(c)!='Mn')
    s=s.replace('ș','s').replace('ş','s').replace('ț','t').replace('ţ','t')
    s=s.replace('°','').replace('.','').replace("'",'')
    return re.sub(r'\s+',' ',re.sub(r'[^0-9a-z ]',' ',s)).strip()
ALIAS={}
for L in LIBRI:
    for a in [L[1],L[2]]+L[5].split():
        ALIAS.setdefault(sk(a),L[0])
    for a in L[5].split(' '):
        pass
# alias multi-parola dal campo alias (separati in modo grezzo): aggiungo forme composte
for L in LIBRI:
    for a in re.findall(r'[a-zà-ÿăâîșşțţ0-9]+(?: [a-zà-ÿăâîșşțţ]+)*',L[5]):
        ALIAS.setdefault(sk(a),L[0])
def trova(txt):
    if not txt: return None
    s=sk(txt)
    s=re.sub(r'\s*(\d+\s*[:,].*)$','',s).strip()
    s=re.sub(r'\s+\d+$','',s).strip()
    if s in ALIAS: return ALIAS[s]
    for n in (4,3,2,1):
        p=' '.join(s.split()[:n])
        if p in ALIAS: return ALIAS[p]
    return None
